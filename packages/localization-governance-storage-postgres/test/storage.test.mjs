import test from 'node:test';
import assert from 'node:assert/strict';

import { createPostgresStorage } from '../src/index.js';

function createClient() {
  const calls = [];
  const rows = {
    locales: new Map(),
    versions: new Map(),
    validations: new Map(),
    reviews: [],
    activations: [],
  };

  return {
    calls,
    async transaction(callback) {
      calls.push({ sql: 'BEGIN', params: [] });
      try {
        const result = await callback(this);
        calls.push({ sql: 'COMMIT', params: [] });
        return result;
      } catch (error) {
        calls.push({ sql: 'ROLLBACK', params: [] });
        throw error;
      }
    },
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('FROM localization_locales') && sql.includes('locale_code =')) {
        return { rows: [...rows.locales.values()].filter((row) => (
          row.tenant_id === params[0] && row.locale_code === params[1]
        )) };
      }
      if (sql.includes('FROM localization_locales') && sql.includes('ORDER BY locale_code')) {
        return { rows: [...rows.locales.values()].filter((row) => row.tenant_id === params[0]) };
      }
      if (sql.startsWith('INSERT INTO localization_locales')) {
        rows.locales.set(params[1], {
          tenant_id: params[0],
          id: params[1],
          locale_code: params[2],
          source_locale: params[3],
          policy_id: params[4],
          active_version_id: params[5],
          created_at: params[6],
          updated_at: params[7],
        });
        return { rows: [] };
      }
      if (sql.includes('FROM localization_catalog_versions') && sql.includes('v.id =')) {
        const row = rows.versions.get(params[1]);
        return { rows: row?.tenant_id === params[0] ? [row] : [] };
      }
      if (sql.includes('FROM localization_catalog_versions') && sql.includes('v.locale_id =')) {
        return {
          rows: [...rows.versions.values()]
            .filter((row) => row.tenant_id === params[0] && row.locale_id === params[1]),
        };
      }
      if (sql.startsWith('INSERT INTO localization_catalog_versions')) {
        rows.versions.set(params[1], {
          tenant_id: params[0],
          id: params[1],
          locale_id: params[2],
          locale_code: params[3],
          version_number: params[4],
          source_catalog_version: params[5],
          source_content_hash: params[6],
          content_hash: params[7],
          state: params[8],
          messages: params[9],
          provenance: params[10],
          created_by: params[11],
          approved_by: params[12],
          activated_at: params[13],
          created_at: params[14],
          updated_at: params[15],
        });
        return { rows: [] };
      }
      if (sql.startsWith('UPDATE localization_catalog_versions')) {
        const current = rows.versions.get(params[14]);
        rows.versions.set(params[14], {
          ...current,
          locale_code: params[1],
          version_number: params[2],
          source_catalog_version: params[3],
          source_content_hash: params[4],
          content_hash: params[5],
          state: params[6],
          messages: params[7],
          provenance: params[8],
          created_by: params[9],
          approved_by: params[10],
          activated_at: params[11],
          created_at: params[12],
          updated_at: params[13],
        });
        return { rows: [] };
      }
      if (sql.includes('FOR UPDATE')) {
        return { rows: [...rows.locales.values()].filter((row) => (
          row.tenant_id === params[0] && row.id === params[1]
        )) };
      }
      if (sql.startsWith('UPDATE localization_locales')) {
        const locale = rows.locales.get(params[3]);
        rows.locales.set(params[3], { ...locale, active_version_id: params[1] });
        return { rows: [] };
      }
      if (sql.startsWith('INSERT INTO localization_activation_history')) {
        rows.activations.push(params);
        return { rows: [] };
      }
      if (sql.includes('FROM localization_activation_history')) return { rows: [] };
      if (sql.startsWith('INSERT INTO localization_validation_reports')) return { rows: [] };
      if (sql.includes('FROM localization_validation_reports')) return { rows: [] };
      if (sql.startsWith('INSERT INTO localization_review_decisions')) return { rows: [] };
      if (sql.includes('FROM localization_review_decisions')) return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

const locale = {
  id: 'locale-es',
  code: 'es-MX',
  sourceLocale: 'en-US',
  policyId: 'default',
  activeVersionId: null,
  createdAt: '2026-06-07T00:00:00.000Z',
  updatedAt: '2026-06-07T00:00:00.000Z',
};

const version = {
  id: 'version-es-1',
  localeId: locale.id,
  locale: locale.code,
  version: 1,
  sourceCatalogVersion: 1,
  sourceContentHash: 'source-hash',
  contentHash: 'content-hash',
  state: 'approved',
  messages: { hello: 'Hola' },
  provenance: { import: 'test' },
  createdBy: 'admin-1',
  createdAt: '2026-06-07T00:00:00.000Z',
  updatedAt: '2026-06-07T00:00:00.000Z',
};

test('requires an explicit tenant binding', () => {
  assert.throws(() => createPostgresStorage({ client: createClient() }), /tenantId/);
});

test('round-trips locale and version data within the bound tenant', async () => {
  const client = createClient();
  const storage = createPostgresStorage({ client, tenantId: 'tenant-a' });
  await storage.saveLocale(locale);
  await storage.saveVersion(version);

  assert.deepEqual(await storage.getLocale('es-MX'), locale);
  assert.deepEqual(await storage.getVersion(version.id), version);
  assert.equal(client.calls.every((call) => (
    !call.sql.includes('localization_') || call.params[0] === 'tenant-a'
  )), true);
});

test('activation locks the locale row and commits locale pointer plus history atomically', async () => {
  const client = createClient();
  const storage = createPostgresStorage({ client, tenantId: 'tenant-a' });
  await storage.saveLocale(locale);
  await storage.saveVersion(version);

  await storage.transaction(() => storage.setActiveVersion(locale.id, version.id, {
    id: 'activation-1',
    localeId: locale.id,
    catalogVersionId: version.id,
    previousCatalogVersionId: null,
    action: 'activate',
    actorId: 'admin-1',
    createdAt: '2026-06-07T00:01:00.000Z',
  }));

  const statements = client.calls.map((call) => call.sql);
  assert.equal(statements.includes('BEGIN'), true);
  assert.equal(statements.some((sql) => sql.includes('FOR UPDATE')), true);
  assert.equal(statements.some((sql) => sql.startsWith('UPDATE localization_locales')), true);
  assert.equal(statements.some((sql) => sql.startsWith('INSERT INTO localization_activation_history')), true);
  assert.equal(statements.includes('COMMIT'), true);
  assert.equal((await storage.getLocale('es-MX')).activeVersionId, version.id);
});

test('rejects attempts to access a version owned by another tenant', async () => {
  const client = createClient();
  const tenantA = createPostgresStorage({ client, tenantId: 'tenant-a' });
  const tenantB = createPostgresStorage({ client, tenantId: 'tenant-b' });
  await tenantA.saveLocale(locale);
  await tenantA.saveVersion(version);

  assert.equal(await tenantB.getVersion(version.id), null);
});
