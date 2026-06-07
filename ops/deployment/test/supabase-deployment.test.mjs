import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildDeploymentSteps, validateSupabaseEnvironment } from '../apply-supabase.mjs';
import { toBoundedDemoResult } from '../../demo-dataset/common.mjs';

test('Supabase deployment requires the explicit demo environment guard', () => {
  assert.throws(
    () => validateSupabaseEnvironment({
      DEMO_ENVIRONMENT: 'false',
      DB_NAME: 'postgres',
      DB_USER: 'postgres',
      DB_PASSWORD: 'secret',
      DB_ENCRYPTION_KEY: 'a'.repeat(64),
    }),
    /DEMO_ENVIRONMENT=true/,
  );
});

test('Supabase deployment requires database and encryption configuration', () => {
  assert.throws(
    () => validateSupabaseEnvironment({ DEMO_ENVIRONMENT: 'true' }),
    /DB_NAME/,
  );
});

test('Supabase deployment runs schema, migrations, seed, localization, and verification in order', () => {
  assert.deepEqual(
    buildDeploymentSteps().map((step) => step.name),
    ['initial-schema', 'incremental-migrations', 'synthetic-dataset', 'localization-catalog', 'verification'],
  );
});

test('destructive demo entry points enforce the shared demo guard', async () => {
  for (const file of ['apply.mjs', 'finalize.mjs', 'apply-sql.mjs']) {
    const source = await readFile(new URL(`../../demo-dataset/${file}`, import.meta.url), 'utf8');
    assert.match(source, /assertDemoEnvironment/);
  }
});

test('demo deployment output omits credentials and record-level verification details', () => {
  const bounded = toBoundedDemoResult({
    tenantId: 'system',
    referenceDate: '2026-06-07T00:00:00.000Z',
    applied: { clients: 10 },
    credentials: { practiceAdminPassword: 'secret' },
    verification: {
      passed: true,
      invariants: [{ name: 'exact_client_ids', actual: ['client-001'] }],
    },
  });
  assert.deepEqual(bounded, {
    skipped: false,
    tenantId: 'system',
    referenceDate: '2026-06-07T00:00:00.000Z',
    applied: { clients: 10 },
    invariantCount: 1,
    passed: true,
  });
});
