import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

// ─── Tenant slug registry ─────────────────────────────────────────────────────

export async function getTenantBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT ts.tenant_id, ts.slug, ts.is_active,
            tp.requested_practice_name, tp.status AS provisioning_status,
            tp.owner_email_enc, tp.owner_email
     FROM tenant_slugs ts
     LEFT JOIN tenant_provisioning tp ON tp.tenant_id = ts.tenant_id
     WHERE ts.slug = ? AND ts.is_active = true
     LIMIT 1`,
    [slug],
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    tenantId: row.tenant_id,
    slug: row.slug,
    isActive: Boolean(row.is_active),
    practiceName: row.requested_practice_name ?? null,
    provisioningStatus: row.provisioning_status ?? null,
    ownerEmail: row.owner_email_enc ? decrypt(row.owner_email_enc) : (row.owner_email ?? null),
  };
}

export async function createTenantSlug({ tenantId, slug }) {
  await pool.query(
    `INSERT INTO tenant_slugs (tenant_id, slug, is_active)
     VALUES (?, ?, true)
     ON CONFLICT (slug) DO NOTHING`,
    [tenantId, slug],
  );
}

export async function deactivateTenantSlug(slug) {
  await pool.query(
    'UPDATE tenant_slugs SET is_active = false WHERE slug = ?',
    [slug],
  );
}

// ─── Tenant subscription queries ──────────────────────────────────────────────

export async function getTenantSubscription(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM tenant_subscriptions WHERE tenant_id = ? LIMIT 1',
    [tenantId],
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    tenantId: row.tenant_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    trialEndsAt: row.trial_ends_at,
    currentPeriodEnd: row.current_period_end,
    canceledAt: row.canceled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertTenantSubscription(fields) {
  const {
    tenantId, stripeCustomerId, stripeSubscriptionId,
    stripePriceId, status, trialEndsAt, currentPeriodEnd, canceledAt,
  } = fields;
  await pool.query(
    `INSERT INTO tenant_subscriptions
       (tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        status, trial_ends_at, current_period_end, canceled_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON CONFLICT (tenant_id) DO UPDATE SET
       stripe_customer_id     = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       stripe_price_id        = EXCLUDED.stripe_price_id,
       status                 = EXCLUDED.status,
       trial_ends_at          = EXCLUDED.trial_ends_at,
       current_period_end     = EXCLUDED.current_period_end,
       canceled_at            = EXCLUDED.canceled_at,
       updated_at             = NOW()`,
    [
      tenantId, stripeCustomerId, stripeSubscriptionId, stripePriceId,
      status,
      trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
      canceledAt ? new Date(canceledAt).toISOString() : null,
    ],
  );
}

// ─── Subscription access gate ─────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['trial', 'active']);

export function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.has(subscription.status)) return false;
  if (subscription.status === 'trial' && subscription.trialEndsAt) {
    return new Date(subscription.trialEndsAt) > new Date();
  }
  return true;
}

// ─── tenant_slugs table migration ─────────────────────────────────────────────
// Called from migrate.js to ensure the table exists.

export async function ensureTenantSlugsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS tenant_slugs (
      slug        VARCHAR(64)  NOT NULL,
      tenant_id   VARCHAR(64)  NOT NULL,
      is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      PRIMARY KEY (slug)
    )
  `);
}
