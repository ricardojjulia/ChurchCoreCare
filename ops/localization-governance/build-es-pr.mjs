#!/usr/bin/env node

import crypto from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { hashCatalog } from '../../packages/localization-governance-core/src/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UNTRANSLATED_ALLOWLIST = new Set([
  'billing.aging.total',
  'client.diagnoses.lookupLabel',
  'client.diagnoses.lookupDescription',
  'client.diagnoses.lookupEmpty',
  'demographics.field.phonePlaceholder',
  'demographics.notify.error',
  'demographics.phoneType.fax',
  'practice.notify.error',
  'practice.video.jaasAppIdPlaceholder',
  'practice.video.jaasApiKeyIdPlaceholder',
  'practice.video.jaasDomainPlaceholder',
]);

export const ES_PR_UNTRANSLATED_ALLOWLIST = Object.freeze(
  [...UNTRANSLATED_ALLOWLIST].sort(),
);

export function extractPlaceholders(value) {
  return [...String(value ?? '').matchAll(/\{([^{}]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

export function listUntranslatedKeys({ sourceMessages, targetMessages }) {
  return Object.keys(sourceMessages).filter((key) => (
    sourceMessages[key] === targetMessages[key] && !UNTRANSLATED_ALLOWLIST.has(key)
  ));
}

export function buildEsPrCatalog({ sourceMessages, spanishSeed, regionalOverrides = {} }) {
  const missing = Object.keys(sourceMessages).filter((key) => (
    typeof spanishSeed[key] !== 'string' || !spanishSeed[key].trim()
  ));
  if (missing.length > 0) {
    throw new Error(`Missing Spanish seed values: ${missing.join(', ')}`);
  }

  return {
    __label: 'Español (Puerto Rico)',
    __meta: {
      locale: 'es-PR',
      sourceLocale: 'en-US',
      seedLocale: 'es-MX',
      provenance: 'regionalized_from_legacy_spanish_seed',
    },
    ...Object.fromEntries(
      Object.keys(sourceMessages).map((key) => [
        key,
        regionalOverrides[key] ?? spanishSeed[key],
      ]),
    ),
  };
}

export async function publishEsPrCatalog({
  storage,
  service,
  messages,
  contentHash = hashCatalog(messages),
  actor,
  audit = async () => {},
}) {
  let locale = await storage.getLocale('es-PR');
  if (!locale) {
    locale = await service.createLocale({
      code: 'es-PR',
      sourceLocale: 'en-US',
      actor,
    });
  }
  const existing = (await storage.listVersions(locale.id)).find((version) => (
    version.contentHash === contentHash
    && ['draft', 'translated', 'validated', 'in_linguistic_review', 'in_domain_review', 'approved', 'active']
      .includes(version.state)
  ));
  if (existing) {
    let readyVersion = existing;
    let validation = null;
    if (['draft', 'translated'].includes(existing.state)) {
      const validated = await service.validateVersion({
        versionId: existing.id,
        actor,
        untranslatedAllowlist: ES_PR_UNTRANSLATED_ALLOWLIST,
      });
      validation = validated.report;
      readyVersion = validated.version;
    }
    if (readyVersion.state === 'validated') {
      readyVersion = await service.requestReview({
        versionId: readyVersion.id,
        actor,
      });
    }
    await audit({
      action: 'localization.catalog.review_ready',
      targetType: 'localization_catalog_version',
      targetId: readyVersion.id,
      result: 'success',
      reasonCode: readyVersion === existing ? 'already_ready' : 'validation_passed',
    });
    return {
      locale,
      version: readyVersion,
      validation,
      reused: true,
    };
  }
  const version = await service.createCatalogVersion({
    locale: 'es-PR',
    messages,
    actor,
    provenance: {
      provider: 'machine_translation',
      seedLocale: 'es-MX',
      regionalVariant: 'es-PR',
      humanReviewedCount: 0,
    },
  });
  const validation = await service.validateVersion({
    versionId: version.id,
    actor,
    untranslatedAllowlist: ES_PR_UNTRANSLATED_ALLOWLIST,
  });
  const reviewVersion = await service.requestReview({
    versionId: version.id,
    actor,
  });
  await audit({
    action: 'localization.catalog.review_ready',
    targetType: 'localization_catalog_version',
    targetId: reviewVersion.id,
    result: 'success',
    reasonCode: 'validation_passed',
  });
  return {
    locale,
    version: reviewVersion,
    validation: validation.report,
  };
}

export function summarizePublication({ tenantId, result }) {
  return {
    tenantId,
    versionId: result.version.id,
    state: result.version.state,
    validationPassed: result.validation?.passed ?? true,
    coverage: result.validation?.coverage ?? 100,
    reused: Boolean(result.reused),
  };
}

async function main() {
  const { baseMessages } = await import('../../packages/i18n/src/index.js');
  const spanishSeed = JSON.parse(
    await import('node:fs/promises').then(({ readFile }) => (
      readFile(path.join(ROOT, 'apps/api/data/i18n/es-MX.json'), 'utf8')
    )),
  );
  const regionalOverrides = JSON.parse(
    await import('node:fs/promises').then(({ readFile }) => (
      readFile(path.join(ROOT, 'apps/api/data/i18n/es-PR-overrides.json'), 'utf8')
        .catch(() => '{}')
    )),
  );
  const catalog = buildEsPrCatalog({
    sourceMessages: baseMessages,
    spanishSeed,
    regionalOverrides,
  });
  const output = path.join(ROOT, 'apps/api/data/i18n/es-PR.json');
  await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`);
  const summary = {
    locale: 'es-PR',
    sourceLocale: 'en-US',
    keys: Object.keys(baseMessages).length,
    output,
  };

  if (process.argv.includes('--write')) {
    if (!process.argv.includes('--postgres')) {
      throw new Error('--write requires --postgres');
    }
    const tenantFlag = process.argv.indexOf('--tenant');
    const tenantId = tenantFlag >= 0 ? process.argv[tenantFlag + 1]?.trim() : '';
    if (!tenantId) throw new Error('--tenant is required with --postgres --write');
    const [{ createGovernanceService }, { createPostgresStorage }, { createDirectPostgresClient }] =
      await Promise.all([
        import('../../packages/localization-governance-core/src/index.js'),
        import('../../packages/localization-governance-storage-postgres/src/index.js'),
        import('../../apps/api/src/db/direct-postgres-client.js'),
      ]);
    const client = createDirectPostgresClient();
    await client.connect();
    try {
      const storage = createPostgresStorage({ client, tenantId });
      const service = createGovernanceService({ storage });
      const result = await publishEsPrCatalog({
        storage,
        service,
        messages: Object.fromEntries(
          Object.entries(catalog).filter(([key]) => !key.startsWith('__')),
        ),
        actor: { id: 'es-pr-translation-operator', role: 'practice_admin' },
        audit: async (event) => {
          await client.query(
            `INSERT INTO audit_events
               (id, tenant_id, actor_id, actor_role, actor_type, action, target_type, target_id,
                result, reason_code, occurred_at, request_id, source_surface, source_workflow,
                system_component)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              `audit-${crypto.randomUUID()}`,
              tenantId,
              'es-pr-translation-operator',
              'practice_admin',
              'service',
              event.action,
              event.targetType,
              event.targetId,
              event.result,
              event.reasonCode,
              new Date(),
              null,
              'operator_cli',
              'localization.es_pr_translation',
              'localization-governance',
            ],
          );
        },
      });
      summary.governance = summarizePublication({ tenantId, result });
    } finally {
      await client.end();
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
