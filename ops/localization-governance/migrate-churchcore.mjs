#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { hashCatalog } from '../../packages/localization-governance-core/src/index.js';
import { createFilesystemStorage } from '../../packages/localization-governance-storage-filesystem/src/index.js';
import { createPostgresStorage } from '../../packages/localization-governance-storage-postgres/src/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_LOCALES = ['es-MX', 'fr-FR', 'pt-BR'];

function cleanCatalog(catalog = {}) {
  return Object.fromEntries(
    Object.entries(catalog).filter(([key]) => !['__label', '__meta'].includes(key)),
  );
}

function stableId(prefix, ...parts) {
  return `${prefix}-${hashCatalog(parts).slice(0, 20)}`;
}

function evidence(catalog = {}) {
  return {
    machineTranslatedCount: Object.keys(catalog.__meta?.machineTranslated ?? {}).length,
    humanReviewedCount: Object.keys(catalog.__meta?.humanReviewed ?? {}).length,
  };
}

export function planChurchCoreMigration({ sourceMessages, catalogs }) {
  const sourceHash = hashCatalog(sourceMessages);
  const locales = [
    {
      code: 'en-US',
      state: 'active',
      keyCount: Object.keys(sourceMessages).length,
      contentHash: sourceHash,
      evidence: { machineTranslatedCount: 0, humanReviewedCount: 0 },
    },
    ...DEFAULT_LOCALES.map((code) => {
      const catalog = catalogs[code] ?? {};
      const messages = cleanCatalog(catalog);
      return {
        code,
        state: code === 'es-MX' ? 'legacy_unverified' : 'draft',
        keyCount: Object.keys(messages).length,
        contentHash: hashCatalog(messages),
        evidence: evidence(catalog),
      };
    }),
  ];
  return { sourceLocale: 'en-US', sourceContentHash: sourceHash, locales };
}

export async function runChurchCoreMigration({
  storage,
  sourceMessages,
  catalogs,
  write = false,
}) {
  const plan = planChurchCoreMigration({ sourceMessages, catalogs });
  if (!write) return { ...plan, written: false };
  const existing = await storage.listLocales();
  if (plan.locales.every((item) => existing.some((locale) => locale.code === item.code))) {
    return { ...plan, written: false };
  }

  for (const item of plan.locales) {
    if (await storage.getLocale(item.code)) continue;
    const localeId = stableId('locale', item.code);
    const versionId = stableId('version', item.code, item.contentHash);
    const now = new Date().toISOString();
    const messages = item.code === 'en-US'
      ? sourceMessages
      : cleanCatalog(catalogs[item.code] ?? {});
    const locale = {
      id: localeId,
      code: item.code,
      sourceLocale: 'en-US',
      policyId: 'default',
      activeVersionId: item.state === 'active' || item.state === 'legacy_unverified' ? versionId : null,
      createdAt: now,
      updatedAt: now,
    };
    const version = {
      id: versionId,
      localeId,
      locale: item.code,
      version: 1,
      sourceCatalogVersion: 1,
      sourceContentHash: plan.sourceContentHash,
      contentHash: item.contentHash,
      state: item.state,
      messages,
      provenance: {
        import: 'churchcore-care',
        ...item.evidence,
      },
      createdBy: 'churchcore-migration',
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveLocale(locale);
    await storage.saveVersion(version);
    if (locale.activeVersionId) {
      await storage.setActiveVersion(localeId, versionId, {
        id: stableId('activation', item.code, item.contentHash),
        localeId,
        catalogVersionId: versionId,
        previousCatalogVersionId: null,
        action: item.code === 'es-MX' ? 'legacy_compatibility' : 'activate',
        actorId: 'churchcore-migration',
        createdAt: now,
      });
    }
  }
  return { ...plan, written: true };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function main() {
  const write = process.argv.includes('--write');
  const usePostgres = process.argv.includes('--postgres');
  const tenantFlag = process.argv.indexOf('--tenant');
  const tenantId = tenantFlag >= 0 ? process.argv[tenantFlag + 1]?.trim() : '';
  const { baseMessages } = await import('../../packages/i18n/src/index.js');
  const catalogs = Object.fromEntries(
    await Promise.all(DEFAULT_LOCALES.map(async (code) => [
      code,
      await readJson(path.join(ROOT, 'apps/api/data/i18n', `${code}.json`)),
    ])),
  );
  let storage;
  let client;
  if (usePostgres && write) {
    if (!tenantId) throw new Error('--tenant is required with --postgres --write');
    const { createDirectPostgresClient } = await import(
      '../../apps/api/src/db/direct-postgres-client.js'
    );
    client = createDirectPostgresClient();
    await client.connect();
    storage = createPostgresStorage({ client, tenantId });
  } else {
    const directoryFlag = process.argv.indexOf('--directory');
    const directory = directoryFlag >= 0
      ? path.resolve(process.argv[directoryFlag + 1])
      : path.join(ROOT, '.localization-governance');
    storage = await createFilesystemStorage({ directory });
  }
  try {
    const result = await runChurchCoreMigration({
      storage,
      sourceMessages: baseMessages,
      catalogs,
      write,
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client?.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
