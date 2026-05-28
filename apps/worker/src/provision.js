/**
 * Tenant provisioning worker.
 *
 * Polls the platform DB for tenant_provisioning requests in status='queued'
 * and drives them through the provisioning lifecycle:
 *
 *   queued → in_progress → completed | failed
 *
 * The worker runs as a background polling loop started from apps/worker/src/index.js.
 * Each iteration picks up at most one queued request, runs provision(), and
 * writes the result back to the platform DB.
 *
 * Provisioning steps (per tenant):
 *   1. Validate the requested_tenant_id is available (not already taken).
 *   2. Run schema bootstrap SQL on the tenant's DB (same schema.sql as platform).
 *   3. Register a slug entry in tenant_slugs.
 *   4. Create a starter subscription record (status='trial').
 *   5. Mark request as completed.
 *
 * On any failure: mark request as failed and preserve error message for ops review.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { bootstrapTenantSchema } from '../../api/src/lib/tenant-setup.js';

const { Pool } = pg;

const WORKER_INTERVAL_MS = 15_000;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

function buildPlatformPool() {
  return new Pool({
    host:     process.env.DB_HOST     ?? '127.0.0.1',
    port:     Number(process.env.DB_PORT ?? 57322),
    database: process.env.DB_NAME     ?? 'postgres',
    user:     process.env.DB_USER     ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    ssl:      String(process.env.DB_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: true } : false,
    max: 3,
  });
}

async function claimNextQueuedRequest(client) {
  const result = await client.query(`
    UPDATE tenant_provisioning
    SET status = 'in_progress'
    WHERE id = (
      SELECT id FROM tenant_provisioning
      WHERE status = 'queued'
      ORDER BY requested_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return result.rows[0] ?? null;
}

async function markCompleted(client, requestId) {
  await client.query(
    `UPDATE tenant_provisioning
     SET status = 'completed', completed_at = NOW()
     WHERE id = $1`,
    [requestId],
  );
}

async function markFailed(client, requestId, reason) {
  await client.query(
    `UPDATE tenant_provisioning
     SET status = 'failed', completed_at = NOW()
     WHERE id = $1`,
    [requestId],
  );
  console.error(`[provision-worker] Provisioning failed for request ${requestId}: ${reason}`);
}

async function isTenantIdAvailable(client, tenantId) {
  const result = await client.query(
    'SELECT COUNT(*) AS cnt FROM tenant_slugs WHERE tenant_id = $1',
    [tenantId],
  );
  return Number(result.rows[0]?.cnt ?? 1) === 0;
}

async function registerTenantSlug(client, tenantId, slug) {
  await client.query(
    `INSERT INTO tenant_slugs (slug, tenant_id, is_active, created_at)
     VALUES ($1, $2, TRUE, NOW())
     ON CONFLICT (slug) DO NOTHING`,
    [slug, tenantId],
  );
}

async function createTrialSubscription(client, tenantId) {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);
  await client.query(
    `INSERT INTO tenant_subscriptions
       (tenant_id, status, trial_ends_at, created_at, updated_at)
     VALUES ($1, 'trial', $2, NOW(), NOW())
     ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId, trialEnd.toISOString()],
  );
}

async function provisionRequest(platformClient, request) {
  const {
    id,
    requested_tenant_id:    tenantId,
    requested_practice_name: practiceName,
    owner_email_enc:         ownerEmailEnc,
    owner_email_hash:        ownerEmailHash,
    owner_password_hash:     ownerPasswordHash,
  } = request;

  console.log(`[provision-worker] Starting provisioning for tenant ${tenantId} (request ${id})`);

  const slug = tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');

  const available = await isTenantIdAvailable(platformClient, tenantId);
  if (!available) {
    throw new Error(`Tenant ID ${tenantId} is already registered`);
  }

  // Bootstrap the tenant DB schema if we have owner credentials
  if (ownerEmailEnc && ownerEmailHash && ownerPasswordHash) {
    await bootstrapTenantSchema({
      tenantId,
      practiceName,
      ownerEmailEnc,
      ownerEmailHash,
      ownerPasswordHash,
    });
  }

  await registerTenantSlug(platformClient, tenantId, slug);
  await createTrialSubscription(platformClient, tenantId);

  console.log(`[provision-worker] Tenant ${tenantId} provisioned: slug=${slug}, practice="${practiceName}"`);
}

export async function runProvisioningCycle(platformPool) {
  if (!process.env.DB_NAME) return;

  const client = await platformPool.connect();
  try {
    await client.query('BEGIN');
    const request = await claimNextQueuedRequest(client);
    if (!request) {
      await client.query('ROLLBACK');
      return;
    }

    try {
      await provisionRequest(client, request);
      await markCompleted(client, request.id);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      // Re-acquire outside transaction to write failure status
      await platformPool.query(
        `UPDATE tenant_provisioning SET status = 'failed', completed_at = NOW() WHERE id = $1`,
        [request.id],
      );
      await markFailed(client, request.id, err.message);
    }
  } finally {
    client.release();
  }
}

export function startProvisioningWorker() {
  if (!process.env.DB_NAME) {
    console.log('[provision-worker] DB_NAME not set — provisioning worker disabled');
    return null;
  }

  const platformPool = buildPlatformPool();
  console.log('[provision-worker] Started, polling every', WORKER_INTERVAL_MS / 1000, 'seconds');

  const interval = setInterval(async () => {
    try {
      await runProvisioningCycle(platformPool);
    } catch (err) {
      console.error('[provision-worker] Unhandled cycle error:', err.message);
    }
  }, WORKER_INTERVAL_MS);

  interval.unref();

  return {
    stop: async () => {
      clearInterval(interval);
      await platformPool.end();
    },
  };
}
