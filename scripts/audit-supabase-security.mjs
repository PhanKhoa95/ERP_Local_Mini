import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const TENANT_TABLES = new Set([
  'product_variant_components',
  'wholesale_settings',
  'product_wholesale_prices',
  'loyalty_settings',
  'referral_settings',
  'loyalty_transactions',
  'product_reviews',
  'platform_category_mappings',
  'platform_push_logs',
  'payment_settings',
  'warehouse_permissions',
  'crm_companies',
  'crm_contacts',
  'crm_custom_fields',
  'crm_custom_field_values',
  'crm_api_keys',
  'crm_pos_chat_settings',
  'crm_lead_forms',
  'crm_automation_rules',
]);

const STOCK_RPCS = [
  'increment_stock_quantity',
  'increment_variant_stock_quantity',
  'complete_production_order',
];

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '');
}

function collectPolicyEvents(sql, file) {
  const events = [];
  const createRegex = /CREATE\s+POLICY\s+(?:"([^"]+)"|([A-Za-z_][\w$]*))\s+ON\s+(?:public\.)?([A-Za-z_][\w$]*)\b[\s\S]*?;/gi;
  const dropRegex = /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([A-Za-z_][\w$]*))\s+ON\s+(?:public\.)?([A-Za-z_][\w$]*)\s*;/gi;

  for (const match of sql.matchAll(createRegex)) {
    events.push({
      index: match.index,
      action: 'create',
      name: match[1] || match[2],
      table: match[3].toLowerCase(),
      statement: match[0],
      file,
    });
  }

  for (const match of sql.matchAll(dropRegex)) {
    events.push({
      index: match.index,
      action: 'drop',
      name: match[1] || match[2],
      table: match[3].toLowerCase(),
      file,
    });
  }

  return events.sort((left, right) => left.index - right.index);
}

function getLatestFunctionDefinitions(migrations) {
  const latest = new Map();
  for (const migration of migrations) {
    for (const functionName of STOCK_RPCS) {
      const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const definitionRegex = new RegExp(
        `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${escapedName}\\s*\\([\\s\\S]*?\\n\\$\\$;`,
        'gi',
      );
      for (const match of migration.sql.matchAll(definitionRegex)) {
        latest.set(functionName, { file: migration.file, definition: match[0] });
      }
    }
  }
  return latest;
}

function audit() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Supabase migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  const migrations = files.map(file => ({
    file,
    sql: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'),
  }));

  const activePolicies = new Map();
  const rlsEnabledTables = new Set();

  for (const migration of migrations) {
    const sql = stripComments(migration.sql);
    const rlsRegex = /ALTER\s+TABLE\s+(?:public\.)?([A-Za-z_][\w$]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;/gi;
    for (const match of sql.matchAll(rlsRegex)) {
      rlsEnabledTables.add(match[1].toLowerCase());
    }

    for (const event of collectPolicyEvents(sql, migration.file)) {
      const key = `${event.table}\u0000${event.name}`;
      if (event.action === 'drop') {
        activePolicies.delete(key);
      } else {
        activePolicies.set(key, event);
      }
    }
  }

  const errors = [];
  let auditedPolicyCount = 0;

  for (const table of TENANT_TABLES) {
    if (!rlsEnabledTables.has(table)) {
      errors.push(`${table}: row level security is not enabled`);
    }

    const policies = [...activePolicies.values()].filter(policy => policy.table === table);
    auditedPolicyCount += policies.length;
    if (policies.length === 0) {
      errors.push(`${table}: no active policy remains after replaying migrations`);
      continue;
    }

    for (const policy of policies) {
      const normalized = policy.statement.replace(/\s+/g, ' ');
      if (/\b(?:USING|WITH\s+CHECK)\s*\(\s*true\s*\)/i.test(normalized)) {
        errors.push(`${table}.${policy.name}: permissive true predicate remains active (${policy.file})`);
      }
      if (!/\bTO\s+authenticated\b/i.test(normalized)) {
        errors.push(`${table}.${policy.name}: policy is not explicitly limited to authenticated (${policy.file})`);
      }
      if (!/public\.is_company_(?:member|admin)\s*\(/i.test(normalized)) {
        errors.push(`${table}.${policy.name}: tenant membership/admin predicate is missing (${policy.file})`);
      }
      if (table === 'crm_api_keys' && !/public\.is_company_admin\s*\(/i.test(normalized)) {
        errors.push(`${table}.${policy.name}: API credentials are not restricted to company admins (${policy.file})`);
      }
    }
  }

  const latestFunctions = getLatestFunctionDefinitions(migrations);
  for (const functionName of STOCK_RPCS) {
    const latest = latestFunctions.get(functionName);
    if (!latest) {
      errors.push(`${functionName}: function definition not found`);
      continue;
    }

    const normalized = latest.definition.replace(/\s+/g, ' ');
    if (!/\bSECURITY\s+DEFINER\b/i.test(normalized) || !/\bSET\s+search_path\s*=\s*public\b/i.test(normalized)) {
      errors.push(`${functionName}: hardened SECURITY DEFINER/search_path contract is missing (${latest.file})`);
    }
    if (!/public\.is_company_member\s*\(\s*auth\.uid\(\)\s*,/i.test(normalized)) {
      errors.push(`${functionName}: caller/tenant membership check is missing or reversed (${latest.file})`);
    }
  }

  const allSql = migrations.map(migration => migration.sql).join('\n');
  for (const functionName of STOCK_RPCS) {
    const signature = functionName === 'complete_production_order' ? 'uuid' : 'uuid, numeric';
    const escapedSignature = `${functionName}\\s*\\(\\s*${signature.replace(', ', '\\s*,\\s*')}\\s*\\)`;
    const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.${escapedSignature}\\s+FROM\\s+PUBLIC`, 'i');
    const grantRegex = new RegExp(`GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.${escapedSignature}\\s+TO\\s+authenticated`, 'i');
    if (!revokeRegex.test(allSql)) errors.push(`${functionName}: PUBLIC execute has not been explicitly revoked`);
    if (!grantRegex.test(allSql)) errors.push(`${functionName}: authenticated execute grant is missing`);
  }

  console.log(`Replayed ${files.length} Supabase migration(s).`);
  console.log(`Audited ${auditedPolicyCount} active policy/policies across ${TENANT_TABLES.size} sensitive table(s).`);
  console.log(`Audited ${STOCK_RPCS.length} tenant-sensitive stock RPC(s).`);

  if (errors.length > 0) {
    console.error(`\n[FAIL] Supabase security audit found ${errors.length} issue(s):`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('[PASS] Sensitive policies are tenant-scoped and stock RPCs enforce caller membership.');
}

audit();
