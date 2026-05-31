/**
 * Per-tenant schema bootstrap.
 *
 * Called by the provisioning worker after registering the slug and subscription.
 * Connects to the tenant-specific PostgreSQL database, creates core tables
 * (idempotent), and seeds the initial tenant, practice, and owner staff account.
 *
 * The platform DB and tenant DBs share the same PostgreSQL instance.
 * Tenant DB name convention: churchcore_<tenantId>
 *
 * Usage:
 *   const result = await bootstrapTenantSchema({ tenantId, practiceName, ownerEmail, ownerPassword });
 */

import crypto from 'node:crypto';
import pg from 'pg';
import { applyPlanDefaults } from './subscriptionPlan.js';

const { Pool } = pg;

function buildTenantPool(tenantId) {
  return new Pool({
    host:     process.env.DB_HOST     ?? '127.0.0.1',
    port:     Number(process.env.DB_PORT ?? 57322),
    database: `churchcore_${tenantId}`,
    user:     process.env.DB_USER     ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    ssl:      String(process.env.DB_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: true } : false,
    max: 2,
    connectionTimeoutMillis: 10_000,
  });
}

// Core DDL for a fresh tenant database — PostgreSQL-compatible, all idempotent.
// This is a minimal set covering auth, clinical, billing, and audit surfaces.
const CORE_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    name       VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (name)
  )`,
  `CREATE TABLE IF NOT EXISTS tenants (
    id           VARCHAR(64)  NOT NULL,
    name         VARCHAR(255) NOT NULL,
    plan_type    VARCHAR(64)  NOT NULL DEFAULT 'trial',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS practices (
    id            VARCHAR(64)  NOT NULL,
    tenant_id     VARCHAR(64)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    practice_type VARCHAR(64)  NOT NULL DEFAULT 'solo',
    timezone      VARCHAR(64)  NOT NULL DEFAULT 'America/New_York',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS staff_members (
    id                   VARCHAR(64)  NOT NULL,
    tenant_id            VARCHAR(64)  NOT NULL,
    role                 VARCHAR(64)  NOT NULL DEFAULT 'practice_admin',
    first_name_enc       TEXT         NOT NULL,
    last_name_enc        TEXT         NOT NULL,
    license_type         VARCHAR(64),
    license_number_enc   TEXT,
    supervision_status   VARCHAR(64)  NOT NULL DEFAULT 'not_required',
    supervising_staff_id VARCHAR(64),
    bio_enc              TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS staff_accounts (
    id                 VARCHAR(64)   NOT NULL,
    staff_member_id    VARCHAR(64)   NOT NULL,
    tenant_id          VARCHAR(64)   NOT NULL,
    email              VARCHAR(320)  NULL,
    email_enc          TEXT          NOT NULL,
    email_lookup_hash  CHAR(64)      NOT NULL,
    password_hash      VARCHAR(255)  NOT NULL,
    failed_attempts    INT           NOT NULL DEFAULT 0,
    locked_until       TIMESTAMPTZ   NULL,
    last_login_at      TIMESTAMPTZ   NULL,
    mfa_enabled        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE (email_lookup_hash)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id               VARCHAR(64)  NOT NULL,
    staff_account_id VARCHAR(64)  NOT NULL,
    tenant_id        VARCHAR(64)  NOT NULL,
    token_hash       CHAR(64)     NOT NULL,
    role             VARCHAR(64)  NOT NULL,
    ip_address       VARCHAR(45)  NULL,
    user_agent       TEXT         NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ  NOT NULL,
    invalidated_at   TIMESTAMPTZ  NULL,
    PRIMARY KEY (id),
    UNIQUE (token_hash)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id               VARCHAR(64)  NOT NULL,
    actor_id         VARCHAR(64)  NOT NULL,
    actor_role       VARCHAR(64)  NOT NULL,
    actor_type       VARCHAR(64)  NOT NULL DEFAULT 'staff',
    result           VARCHAR(32)  NOT NULL,
    reason_code      VARCHAR(64)  NOT NULL DEFAULT 'ok',
    source_surface   VARCHAR(255) NULL,
    source_workflow  VARCHAR(255) NULL,
    system_component VARCHAR(255) NULL,
    tenant_id        VARCHAR(64)  NOT NULL,
    action           VARCHAR(255) NOT NULL,
    target_type      VARCHAR(255) NULL,
    target_id        VARCHAR(255) NULL,
    occurred_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    request_id       VARCHAR(64)  NULL,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id                     VARCHAR(64)   NOT NULL,
    tenant_id              VARCHAR(64)   NOT NULL,
    first_name_enc         TEXT,
    last_name_enc          TEXT,
    email_enc              TEXT,
    email_lookup_hash      CHAR(64),
    phone_enc              TEXT,
    date_of_birth_enc      TEXT,
    pronouns               VARCHAR(64),
    status                 VARCHAR(64)   NOT NULL DEFAULT 'active',
    intake_status          VARCHAR(64),
    primary_counselor_id   VARCHAR(64),
    referred_by            TEXT,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS portal_settings (
    id                       VARCHAR(64)  NOT NULL,
    tenant_id                VARCHAR(64)  NOT NULL UNIQUE,
    insurance_billing_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
    ai_notes_enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
    telehealth_enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
  )`,
];

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Bootstrap a new tenant's database schema and seed initial records.
 *
 * @param {object} opts
 * @param {string} opts.tenantId           — canonical tenant/slug identifier
 * @param {string} opts.practiceName       — human-readable practice name
 * @param {string} opts.ownerEmailEnc      — owner's email, already encrypted
 * @param {string} opts.ownerEmailHash     — owner's deterministic lookup hash
 * @param {string} opts.ownerPasswordHash  — owner's argon2id password hash
 * @param {object} [opts.pool]             — optional pre-built pool (for testing)
 * @returns {Promise<{ tenantRecordId, practiceId, memberId, accountId }>}
 */
export async function bootstrapTenantSchema({
  tenantId,
  practiceName,
  ownerEmailEnc,
  ownerEmailHash,
  ownerPasswordHash,
  pool: injectedPool,
}) {
  const pool = injectedPool ?? buildTenantPool(tenantId);
  const client = await pool.connect();

  try {
    for (const stmt of CORE_DDL_STATEMENTS) {
      await client.query(stmt);
    }

    const tenantRecordId = crypto.randomUUID();
    const practiceId    = crypto.randomUUID();
    const memberId      = crypto.randomUUID();
    const accountId     = crypto.randomUUID();
    const settingsId    = crypto.randomUUID();

    await client.query(
      `INSERT INTO tenants (id, name, plan_type) VALUES ($1, $2, 'trial') ON CONFLICT (id) DO NOTHING`,
      [tenantRecordId, practiceName],
    );

    // Apply plan defaults (limits + ui_persona) for the initial plan type
    await applyPlanDefaults(tenantRecordId, 'trial', client);

    await client.query(
      `INSERT INTO practices (id, tenant_id, name, practice_type) VALUES ($1, $2, $3, 'solo') ON CONFLICT (id) DO NOTHING`,
      [practiceId, tenantRecordId, practiceName],
    );

    await client.query(
      `INSERT INTO staff_members (id, tenant_id, role, first_name_enc, last_name_enc)
       VALUES ($1, $2, 'practice_admin', $3, '') ON CONFLICT (id) DO NOTHING`,
      [memberId, tenantRecordId, 'Practice'],
    );

    await client.query(
      `INSERT INTO staff_accounts (id, staff_member_id, tenant_id, email_enc, email_lookup_hash, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [accountId, memberId, tenantRecordId, ownerEmailEnc, ownerEmailHash, ownerPasswordHash],
    );

    await client.query(
      `INSERT INTO portal_settings (id, tenant_id) VALUES ($1, $2) ON CONFLICT (tenant_id) DO NOTHING`,
      [settingsId, tenantRecordId],
    );

    await client.query(
      `INSERT INTO schema_migrations (name) VALUES ('bootstrap_v1') ON CONFLICT DO NOTHING`,
    );

    return { tenantRecordId, practiceId, memberId, accountId };
  } finally {
    client.release();
    if (!injectedPool) await pool.end();
  }
}
