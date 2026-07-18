import fs from 'fs';
import path from 'path';

const FUNCTIONS_DIR = path.join(process.cwd(), 'supabase', 'functions');
const SUPABASE_CONFIG = path.join(process.cwd(), 'supabase', 'config.toml');

// Simple regex patterns to search for potential hardcoded keys/secrets
// e.g. key: "...", api_key: "...", secret: "...", token: "..."
const SECRET_PATTERNS = [
  {
    type: 'credential assignment',
    regex: /(?:const|let)\s+\w*(?:key|secret|token|password|auth|bearer)\w*\s*=\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/gi,
  },
  {
    type: 'authorization header',
    regex: /authorization\s*:\s*['"`]bearer\s+[a-zA-Z0-9_\-]{16,}['"`]/gi,
  },
];

const PLACEHOLDER_MARKERS = [
  'placeholder',
  'mock-token',
  'dummy-token',
  'invalid-token',
  'example-token',
  'fake-token',
  'not-a-real',
  'replace-me',
  'changeme',
];

// Regex to capture Deno.env.get("...") accesses
const ENV_ACCESS_REGEX = /Deno\.env\.get\(\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g;

function getJwtDisabledFunctions() {
  if (!fs.existsSync(SUPABASE_CONFIG)) return new Set();

  const config = fs.readFileSync(SUPABASE_CONFIG, 'utf8');
  const disabled = new Set();
  const functionConfigRegex = /^\[functions\.([^\]]+)\]\s*\r?\nverify_jwt\s*=\s*false/gm;
  let match;
  while ((match = functionConfigRegex.exec(config)) !== null) {
    disabled.add(match[1]);
  }
  return disabled;
}

function isExplicitPlaceholder(value) {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some(marker => normalized.includes(marker));
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

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
  const jwtDisabledFunctions = getJwtDisabledFunctions();
  let totalFiles = 0;
  let totalSecretsAlerts = 0;

  walkDir(FUNCTIONS_DIR, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
    totalFiles++;

    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const functionName = path.relative(FUNCTIONS_DIR, filePath).split(path.sep)[0];
    const fileName = path.basename(filePath);
    
    // Skip checking libraries/vendor files if any
    if (relativePath.includes('node_modules') || relativePath.includes('.deno')) return;

    const fileResults = {
      filePath: relativePath,
      hardcodedSecrets: [],
      envVars: [],
      serviceRoleUsed: false,
      manualUserAuth: false,
      isEntrypoint: fileName === 'index.ts',
      jwtVerificationDisabled: fileName === 'index.ts' && jwtDisabledFunctions.has(functionName),
    };

    // 1. Check for hardcoded secrets
    SECRET_PATTERNS.forEach(({ type, regex }) => {
      regex.lastIndex = 0;
      for (const match of content.matchAll(regex)) {
        if (!isExplicitPlaceholder(match[0])) {
          fileResults.hardcodedSecrets.push({
            line: getLineNumber(content, match.index),
            type,
          });
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

    // 4. Functions with verify_jwt=false must perform an explicit user lookup.
    fileResults.manualUserAuth = /(?:auth\s*\.\s*getUser|getUser\s*\()/i.test(content);

    if (
      fileResults.hardcodedSecrets.length > 0 ||
      fileResults.envVars.length > 0 ||
      fileResults.serviceRoleUsed ||
      fileResults.jwtVerificationDisabled ||
      fileResults.isEntrypoint
    ) {
      results.push(fileResults);
    }
  });

  console.log(`Audited ${totalFiles} file(s) across edge functions.\n`);

  if (totalSecretsAlerts > 0) {
    console.warn(`[WARNING] Found ${totalSecretsAlerts} potential hardcoded secrets:`);
    results.forEach(res => {
      if (res.hardcodedSecrets.length > 0) {
        console.warn(`- ${res.filePath}:`);
        res.hardcodedSecrets.forEach(secret => {
          console.warn(`    line ${secret.line}: ${secret.type} (<redacted>)`);
        });
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

  const missingAuthGateFiles = results
    .filter(r => r.jwtVerificationDisabled && !r.manualUserAuth)
    .map(r => r.filePath);

  console.log('\nAuthentication gate review (verify_jwt=false requires explicit auth.getUser):');
  if (missingAuthGateFiles.length > 0) {
    missingAuthGateFiles.forEach(f => console.warn(`- ${f}`));
  } else {
    console.log('- [PASS] No Edge Function bypasses both gateway JWT verification and explicit user authentication.');
  }

  const gatewayOnlyFiles = results
    .filter(r => r.isEntrypoint && !r.jwtVerificationDisabled && !r.manualUserAuth)
    .map(r => r.filePath);

  console.log('\nGateway-only authorization review:');
  console.log('- verify_jwt validates a signed project JWT, but callers using the public anon JWT are not authenticated users.');
  gatewayOnlyFiles.forEach(f => console.log(`- ${f}`));

  const secretFindingsMarkdown = results
    .flatMap(result => result.hardcodedSecrets.map(secret =>
      `- \`${result.filePath.replace(/\\/g, '/')}\`, line ${secret.line}: ${secret.type} (value redacted)`,
    ));
  const authFindingsMarkdown = missingAuthGateFiles.map(f => `- \`${f.replace(/\\/g, '/')}\``);
  const gatewayOnlyMarkdown = gatewayOnlyFiles.map(f => `- \`${f.replace(/\\/g, '/')}\``);

  // Write audit results summary to a markdown artifact
  const markdownReport = `# Edge Functions Audit Report

## Summary
- **Total Files Audited**: ${totalFiles}
- **Hardcoded Secret Violations**: ${totalSecretsAlerts}
- **Missing Authentication Gates**: ${missingAuthGateFiles.length}
- **Gateway-only Endpoints Requiring Authorization Review**: ${gatewayOnlyFiles.length}

## Potential Hardcoded Secrets
${secretFindingsMarkdown.length > 0 ? secretFindingsMarkdown.join('\n') : '- None detected.'}

## Environment Variables Used
Each variable must be securely set using \`supabase secrets set\` in production.
${sortedEnvVars.map(v => `- \`${v}\``).join('\n')}

## Service Role Key Usage (\`SUPABASE_SERVICE_ROLE_KEY\`)
The following files access the service role client. Ensure these files only perform actions authorized for administrative use and validate inputs properly to avoid privilege escalation:
${serviceRoleFiles.map(f => {
    const normalized = f.replace(/\\/g, '/');
    const label = normalized.replace('supabase/functions/', '');
    return `- [${label}](../${normalized})`;
  }).join('\n')}

## Authentication Gate Review
Functions configured with \`verify_jwt = false\` must explicitly validate the caller with \`auth.getUser\` before privileged work.
${authFindingsMarkdown.length > 0 ? authFindingsMarkdown.join('\n') : '- No missing authentication gates detected.'}

## Gateway-only Authorization Review
\`verify_jwt = true\` validates a signed project JWT, but it does not by itself prove that the caller is an authenticated user because the public anon key is also a project JWT. These endpoints rely on the gateway only and still need caller-role and operation-level authorization review:
${gatewayOnlyMarkdown.length > 0 ? gatewayOnlyMarkdown.join('\n') : '- None.'}
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs', 'EDGE_FUNCTIONS_AUDIT.md'), markdownReport, 'utf8');
  console.log('\nAudit completed. Saved report to docs/EDGE_FUNCTIONS_AUDIT.md');

  if (totalSecretsAlerts > 0 || missingAuthGateFiles.length > 0) {
    process.exitCode = 1;
  }
}

audit();
