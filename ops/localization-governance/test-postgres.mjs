#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDirectPostgresClient } from '../../apps/api/src/db/direct-postgres-client.js';
import { createPostgresStorage } from '../../packages/localization-governance-storage-postgres/src/index.js';

const tenantId = 'localization-integration-test';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const client = createDirectPostgresClient();
const concurrentClient = createDirectPostgresClient();
await client.connect();
await concurrentClient.connect();

const schema = await readFile(
  path.join(root, 'supabase/migrations/20260607000000_localization_governance.sql'),
  'utf8',
);
await client.query(schema);

async function clean() {
  for (const table of [
    'localization_activation_history',
    'localization_review_decisions',
    'localization_review_assignments',
    'localization_validation_reports',
    'localization_catalog_versions',
    'localization_locales',
  ]) {
    await client.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [tenantId]);
  }
}

try {
  await clean();
  const storage = createPostgresStorage({ client, tenantId });
  const concurrentStorage = createPostgresStorage({ client: concurrentClient, tenantId });
  const otherTenant = createPostgresStorage({ client, tenantId: 'other-tenant' });
  const now = '2026-06-07T00:00:00.000Z';
  const locale = {
    id: 'locale-es',
    code: 'es-MX',
    sourceLocale: 'en-US',
    policyId: 'default',
    activeVersionId: null,
    createdAt: now,
    updatedAt: now,
  };
  const version = (id, number) => ({
    id,
    localeId: locale.id,
    locale: locale.code,
    version: number,
    sourceCatalogVersion: 1,
    sourceContentHash: 'a'.repeat(64),
    contentHash: String(number).repeat(64),
    state: 'approved',
    messages: { hello: number === 1 ? 'Hola' : 'Saludos' },
    provenance: { integrationTest: true },
    createdBy: 'integration-test',
    createdAt: now,
    updatedAt: now,
  });

  await storage.saveLocale(locale);
  await storage.saveVersion(version('version-1', 1));
  await storage.saveVersion(version('version-2', 2));
  assert.equal(await otherTenant.getLocale('es-MX'), null);

  await storage.transaction(() => storage.setActiveVersion(locale.id, 'version-1', {
    id: 'activation-1',
    localeId: locale.id,
    catalogVersionId: 'version-1',
    previousCatalogVersionId: null,
    action: 'activate',
    actorId: 'integration-test',
    createdAt: now,
  }));
  assert.equal((await storage.getLocale('es-MX')).activeVersionId, 'version-1');

  await assert.rejects(
    storage.transaction(async () => {
      await storage.setActiveVersion(locale.id, 'version-2', {
        id: 'activation-rollback',
        localeId: locale.id,
        catalogVersionId: 'version-2',
        previousCatalogVersionId: 'version-1',
        action: 'activate',
        actorId: 'integration-test',
        createdAt: now,
      });
      throw new Error('force rollback');
    }),
  );
  assert.equal((await storage.getLocale('es-MX')).activeVersionId, 'version-1');

  await Promise.all([
    storage.transaction(() => storage.setActiveVersion(locale.id, 'version-1', {
      id: 'activation-concurrent-1',
      localeId: locale.id,
      catalogVersionId: 'version-1',
      previousCatalogVersionId: 'version-1',
      action: 'rollback',
      actorId: 'integration-test',
      createdAt: '2026-06-07T00:01:00.000Z',
    })),
    concurrentStorage.transaction(() => concurrentStorage.setActiveVersion(locale.id, 'version-2', {
      id: 'activation-concurrent-2',
      localeId: locale.id,
      catalogVersionId: 'version-2',
      previousCatalogVersionId: 'version-1',
      action: 'activate',
      actorId: 'integration-test',
      createdAt: '2026-06-07T00:02:00.000Z',
    })),
  ]);
  const active = (await storage.getLocale('es-MX')).activeVersionId;
  assert.equal(['version-1', 'version-2'].includes(active), true);
  assert.equal((await storage.listActivationHistory(locale.id)).length, 3);

  console.log('PostgreSQL localization governance integration passed.');
} finally {
  await clean().catch(() => {});
  await concurrentClient.end();
  await client.end();
}
