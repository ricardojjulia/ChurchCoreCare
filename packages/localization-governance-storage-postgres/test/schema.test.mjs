import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../../../supabase/migrations/20260607000000_localization_governance.sql',
  import.meta.url,
);

test('additive migration defines tenant-scoped governance tables and constraints', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  for (const table of [
    'localization_locales',
    'localization_catalog_versions',
    'localization_validation_reports',
    'localization_review_assignments',
    'localization_review_decisions',
    'localization_activation_history',
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    assert.match(
      sql,
      new RegExp(`CREATE INDEX IF NOT EXISTS [^;]+\\s+ON ${table} \\(tenant_id`),
    );
  }
  assert.match(sql, /UNIQUE \(tenant_id, locale_code\)/);
  assert.match(sql, /UNIQUE \(tenant_id, locale_id, version_number\)/);
  assert.match(sql, /UNIQUE \(tenant_id, catalog_version_id, reviewer_role, reviewer_id\)/);
});
