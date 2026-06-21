import fs from 'fs';
import path from 'path';

const FUNCTIONS_DIR = path.join(process.cwd(), 'supabase', 'functions');

// Simple regex patterns to search for potential hardcoded keys/secrets
// e.g. key: "...", api_key: "...", secret: "...", token: "..."
const SECRET_REGEXES = [
  /const\s+\w*(?:key|secret|token|password|auth|bearer)\w*\s*=\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/i,
  /let\s+\w*(?:key|secret|token|password|auth|bearer)\w*\s*=\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/i,
  /authorization\s*:\s*['"`]bearer\s+[a-zA-Z0-9_\-]{16,}['"`]/i,
];

// Regex to capture Deno.env.get("...") accesses
const ENV_ACCESS_REGEX = /Deno\.env\.get\(\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function audit() {
  console.log('=== EDGE FUNCTION SECRETS & SERVICE ROLE USAGE AUDIT ===\n');

  if (!fs.existsSync(FUNCTIONS_DIR)) {
    console.error(`Error: Functions directory not found at ${FUNCTIONS_DIR}`);
    process.exit(1);
  }

  const results = [];
  const envVarsUsed = new Set();
  let totalFiles = 0;
  let totalSecretsAlerts = 0;

  walkDir(FUNCTIONS_DIR, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
    totalFiles++;

    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const fileName = path.basename(filePath);
    
    // Skip checking libraries/vendor files if any
    if (relativePath.includes('node_modules') || relativePath.includes('.deno')) return;

    const fileResults = {
      filePath: relativePath,
      hardcodedSecrets: [],
      envVars: [],
      serviceRoleUsed: false,
    };

    // 1. Check for hardcoded secrets
    SECRET_REGEXES.forEach(regex => {
      const match = content.match(regex);
      if (match) {
        // Exclude some common false positives like import paths, fallback mock templates, or system/placeholder keys
        const line = match[0];
        if (!line.includes('placeholder') && !line.includes('mock') && !line.includes('dummy') && !line.includes('test_')) {
          fileResults.hardcodedSecrets.push(line);
          totalSecretsAlerts++;
        }
      }
    });

    // 2. Extract accessed Deno.env variables
    let envMatch;
    // Reset global regex index
    ENV_ACCESS_REGEX.lastIndex = 0;
    while ((envMatch = ENV_ACCESS_REGEX.exec(content)) !== null) {
      const varName = envMatch[1];
      fileResults.envVars.push(varName);
      envVarsUsed.add(varName);
    }

    // 3. Check for service role key usage
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      fileResults.serviceRoleUsed = true;
    }

    if (fileResults.hardcodedSecrets.length > 0 || fileResults.envVars.length > 0 || fileResults.serviceRoleUsed) {
      results.push(fileResults);
    }
  });

  console.log(`Audited ${totalFiles} file(s) across edge functions.\n`);

  if (totalSecretsAlerts > 0) {
    console.warn(`[WARNING] Found ${totalSecretsAlerts} potential hardcoded secrets:`);
    results.forEach(res => {
      if (res.hardcodedSecrets.length > 0) {
        console.warn(`- ${res.filePath}:`);
        res.hardcodedSecrets.forEach(line => console.warn(`    ${line}`));
      }
    });
    console.log();
  } else {
    console.log('[PASS] No hardcoded secrets or sensitive credentials found in code literals.\n');
  }

  console.log('Environment variables accessed across Edge Functions:');
  const sortedEnvVars = Array.from(envVarsUsed).sort();
  sortedEnvVars.forEach(v => {
    console.log(`- ${v}`);
  });
  console.log();

  console.log('Usage of SUPABASE_SERVICE_ROLE_KEY (Security def / bypass RLS):');
  const serviceRoleFiles = results.filter(r => r.serviceRoleUsed).map(r => r.filePath);
  if (serviceRoleFiles.length > 0) {
    serviceRoleFiles.forEach(f => {
      console.log(`- ${f}`);
    });
  } else {
    console.log('- None');
  }

  // Write audit results summary to a markdown artifact
  const markdownReport = `# Edge Functions Audit Report

## Summary
- **Total Files Audited**: ${totalFiles}
- **Hardcoded Secret Violations**: ${totalSecretsAlerts}

## Environment Variables Used
Each variable must be securely set using \`supabase secrets set\` in production.
${sortedEnvVars.map(v => `- \`${v}\``).join('\n')}

## Service Role Key Usage (\`SUPABASE_SERVICE_ROLE_KEY\`)
The following files access the service role client. Ensure these files only perform actions authorized for administrative use and validate inputs properly to avoid privilege escalation:
${serviceRoleFiles.map(f => `- [${path.basename(f)}](file:///${path.resolve(f).replace(/\\/g, '/')})`).join('\n')}
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs', 'EDGE_FUNCTIONS_AUDIT.md'), markdownReport, 'utf8');
  console.log('\nAudit completed. Saved report to docs/EDGE_FUNCTIONS_AUDIT.md');
}

audit();
