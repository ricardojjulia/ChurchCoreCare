#!/usr/bin/env node
/**
 * Operator script: review → approve → activate es-PR
 *
 * Run this as an authenticated human operator after reviewing the es-PR catalog.
 *
 * Usage:
 *   node --env-file=.env ops/localization-governance/activate-es-pr.mjs \
 *     --reviewer-id <your-staff-id> \
 *     --reviewer-name "<Your Name>" \
 *     [--comment "Optional review note"]
 *
 * The script will:
 *   1. Check the current governance state of es-PR
 *   2. Submit the required linguistic review as the given reviewer
 *   3. Approve the version
 *   4. Activate the locale
 *   5. Patch apps/api/data/i18n/settings.json to include es-PR at runtime
 */

import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SETTINGS_PATH = path.join(ROOT, 'apps/api/data/i18n/settings.json');

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      flags[key] = argv[i + 1]?.startsWith('--') ? true : (argv[++i] ?? true);
    }
  }
  return flags;
}

async function auditEvent(client, tenantId, event) {
  await client.query(
    `INSERT INTO audit_events
       (id, tenant_id, actor_id, actor_role, actor_type, action, target_type, target_id,
        result, reason_code, occurred_at, request_id, source_surface, source_workflow,
        system_component)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      `audit-${crypto.randomUUID()}`,
      tenantId,
      event.actorId,
      event.actorRole,
      'service',
      event.action,
      event.targetType,
      event.targetId,
      event.result,
      event.reasonCode,
      new Date(),
      null,
      'operator_cli',
      'localization.es_pr_activation',
      'localization-governance',
    ],
  );
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const reviewerId = flags.reviewerId;
  const reviewerName = flags.reviewerName ?? reviewerId;
  const comment = flags.comment ?? '';
  const tenantId = flags.tenant ?? 'system';
  const dryRun = Boolean(flags.dryRun);

  if (!reviewerId) {
    console.error('Error: --reviewer-id is required (your staff member ID)');
    console.error('\nUsage:');
    console.error('  node --env-file=.env ops/localization-governance/activate-es-pr.mjs \\');
    console.error('    --reviewer-id <your-staff-id> \\');
    console.error('    --reviewer-name "<Your Name>" \\');
    console.error('    [--comment "Optional note"] \\');
    console.error('    [--dry-run]');
    process.exit(1);
  }

  const [
    { createGovernanceService },
    { createPostgresStorage },
    { createDirectPostgresClient },
  ] = await Promise.all([
    import('../../packages/localization-governance-core/src/index.js'),
    import('../../packages/localization-governance-storage-postgres/src/index.js'),
    import('../../apps/api/src/db/direct-postgres-client.js'),
  ]);

  const client = createDirectPostgresClient();
  await client.connect();

  try {
    const storage = createPostgresStorage({ client, tenantId });
    const service = createGovernanceService({ storage });
    const actor = { id: reviewerId, role: 'practice_admin' };
    const reviewer = { id: reviewerId, role: 'linguistic', name: reviewerName };

    // ── 1. Check current state ────────────────────────────────────────────────
    const status = await service.getLocaleStatus('es-PR');
    console.log('\n── es-PR current status ─────────────────────────────────────');
    console.log(JSON.stringify(status, null, 2));

    const pending = status.versions.find((v) => v.state === 'in_linguistic_review');
    if (!pending) {
      console.error('\nNo version is currently in_linguistic_review. Nothing to do.');
      process.exit(1);
    }

    console.log(`\nVersion to review: ${pending.id}`);
    console.log(`Reviewer:          ${reviewerName} (${reviewerId})`);
    if (dryRun) {
      console.log('\n[dry-run] Stopping here — no changes made.');
      process.exit(0);
    }

    // ── 2. Submit linguistic review ───────────────────────────────────────────
    console.log('\n── Step 1: Submitting linguistic review ─────────────────────');
    const review = await service.submitReview({
      versionId: pending.id,
      reviewer,
      decision: 'approved',
      comment,
    });
    await auditEvent(client, tenantId, {
      actorId: reviewerId,
      actorRole: 'linguistic',
      action: 'localization.catalog.review_submitted',
      targetType: 'localization_catalog_version',
      targetId: pending.id,
      result: 'success',
      reasonCode: 'linguistic_approved',
    });
    console.log(`Review submitted: ${review.id} — decision: ${review.decision}`);

    // ── 3. Approve version ────────────────────────────────────────────────────
    console.log('\n── Step 2: Approving version ────────────────────────────────');
    const approved = await service.approveVersion({ versionId: pending.id, actor });
    await auditEvent(client, tenantId, {
      actorId: reviewerId,
      actorRole: 'practice_admin',
      action: 'localization.catalog.approved',
      targetType: 'localization_catalog_version',
      targetId: pending.id,
      result: 'success',
      reasonCode: 'all_reviews_complete',
    });
    console.log(`Version state: ${approved.state}`);

    // ── 4. Activate locale ────────────────────────────────────────────────────
    console.log('\n── Step 3: Activating es-PR ─────────────────────────────────');
    const activated = await service.activateVersion({ versionId: pending.id, actor });
    await auditEvent(client, tenantId, {
      actorId: reviewerId,
      actorRole: 'practice_admin',
      action: 'localization.catalog.activated',
      targetType: 'localization_catalog_version',
      targetId: pending.id,
      result: 'success',
      reasonCode: 'operator_activation',
    });
    console.log(`Version state: ${activated.state}`);

    // ── 5. Patch settings.json ────────────────────────────────────────────────
    console.log('\n── Step 4: Registering es-PR in settings.json ───────────────');
    const settings = JSON.parse(await readFile(SETTINGS_PATH, 'utf8'));
    if (!settings['es-PR']) {
      settings['es-PR'] = {
        sourceLocale: 'en-US',
        tone: 'pastoral',
        fallbackMode: 'copy',
        useGlossary: true,
        glossary: {},
      };
      await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
      console.log('settings.json updated — es-PR is now a runtime locale.');
    } else {
      console.log('settings.json already includes es-PR — no change needed.');
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n── Done ─────────────────────────────────────────────────────');
    console.log(`es-PR is now ACTIVE (version ${pending.id})`);
    console.log('Restart the API to serve the new locale.');

  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
