/**
 * Tenant-aware PostgreSQL pool registry.
 *
 * Provides a mysql2-compatible interface (pool.query returns [rows, fields])
 * so existing query modules work with only SQL syntax changes.
 * Automatically converts ? placeholders to $1, $2, … for pg.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { isProvisionedTenantStatus } from '../lib/tenant-provisioning.js';
import { databaseConfigFromEnv, requireDatabaseEnv } from './config.js';
import { buildDatabaseSslConfig } from './ssl.js';

const { Pool } = pg;

const tenantContextStorage = new AsyncLocalStorage();
const poolRegistry = new Map();
let tenantSlugCache = {
  expiresAt: 0,
  slugs: new Set(['system']),
};

// Convert mysql2-style ? placeholders to pg-style $1, $2, …
function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Wrap a pg result to look like mysql2's [rows, fields]
function pgResult(result) {
  return [result.rows, result.fields ?? []];
}

class PgPoolAdapter {
  constructor(config) {
    this._pool = new Pool(config);
    this._pool.on('error', () => {}); // suppress unhandled idle-client errors
  }

  async query(sql, params = []) {
    const result = await this._pool.query(toPositional(sql), params);
    return pgResult(result);
  }

  async execute(sql, params = []) {
    return this.query(sql, params);
  }

  async getConnection() {
    const client = await this._pool.connect();
    return {
      query:  (sql, params = []) => client.query(toPositional(sql), params).then(pgResult),
      execute:(sql, params = []) => client.query(toPositional(sql), params).then(pgResult),
      ping:   () => client.query('SELECT 1'),
      release:() => client.release(),
      beginTransaction: () => client.query('BEGIN'),
      commit:           () => client.query('COMMIT'),
      rollback:         () => client.query('ROLLBACK'),
    };
  }

  async end() {
    return this._pool.end();
  }
}

function buildPoolConfig(config) {
  requireDatabaseEnv({
    DB_HOST: config.host,
    DB_PORT: String(config.port ?? ''),
    DB_NAME: config.database,
    DB_USER: config.user,
    DB_PASSWORD: config.password,
    DB_SSL: config.ssl,
    DB_SSL_REJECT_UNAUTHORIZED: config.sslRejectUnauthorized,
    CHURCHCORE_ALLOW_TEST_DATABASE: process.env.CHURCHCORE_ALLOW_TEST_DATABASE,
  });
  return {
    host:             config.host,
    port:             Number(config.port),
    database:         config.database,
    user:             config.user,
    password:         config.password,
    ssl:              buildDatabaseSslConfig({
      DB_SSL: config.ssl,
      DB_SSL_REJECT_UNAUTHORIZED: config.sslRejectUnauthorized,
    }),
    max:              config.connectionLimit,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis:       30_000,
  };
}

function defaultDbConfigFromEnv() {
  return databaseConfigFromEnv();
}

function parseTenantDbMap() {
  if (!process.env.TENANT_DB_MAP) return {};
  try {
    const parsed = JSON.parse(process.env.TENANT_DB_MAP);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function parseAllowedTenantSlugsFromEnv() {
  const raw = process.env.TENANT_ALLOWED_SLUGS || '';
  return new Set(
    raw.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean),
  );
}

function resolveTenantDbConfig(tenantId) {
  const tenantMap = parseTenantDbMap();
  if (tenantId && tenantMap[tenantId]) return tenantMap[tenantId];
  return defaultDbConfigFromEnv();
}

export function runWithTenantContext(tenantContext, fn) {
  return tenantContextStorage.run(tenantContext, fn);
}

export function getTenantContext() {
  return tenantContextStorage.getStore() || null;
}

export function getPoolForTenant(tenantId = 'system') {
  const key = tenantId || 'system';
  if (poolRegistry.has(key)) return poolRegistry.get(key);
  const config = resolveTenantDbConfig(key);
  const pool = new PgPoolAdapter(buildPoolConfig(config));
  poolRegistry.set(key, pool);
  return pool;
}

async function listProvisionedTenantSlugsFromDb() {
  const defaultPool = getPoolForTenant('system');
  const [rows] = await defaultPool.query(
    `SELECT requested_tenant_id, status, completed_at
       FROM tenant_provisioning
      WHERE requested_tenant_id IS NOT NULL`,
  );
  const slugs = new Set(['system']);
  for (const row of rows) {
    const slug   = String(row.requested_tenant_id || '').trim().toLowerCase();
    const status = String(row.status || '').trim().toLowerCase();
    if (!slug) continue;
    if (Boolean(row.completed_at) || isProvisionedTenantStatus(status)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

export async function getKnownTenantSlugs() {
  const now = Date.now();
  if (tenantSlugCache.expiresAt > now) return tenantSlugCache.slugs;

  const slugs = new Set(['system']);
  for (const slug of parseAllowedTenantSlugsFromEnv()) slugs.add(slug);

  try {
    const dbSlugs = await listProvisionedTenantSlugsFromDb();
    for (const slug of dbSlugs) slugs.add(slug);
  } catch {
    // Fall back to env-only allowlist if DB lookup is unavailable.
  }

  const ttlMs = Number(process.env.TENANT_SLUG_CACHE_TTL_MS || 60_000);
  tenantSlugCache = { expiresAt: now + Math.max(ttlMs, 5_000), slugs };
  return tenantSlugCache.slugs;
}

export function getActivePool() {
  const context = getTenantContext();
  return getPoolForTenant(context?.tenantId || 'system');
}

export async function closeAllPools() {
  const pools = [...poolRegistry.values()];
  poolRegistry.clear();
  await Promise.allSettled(pools.map((p) => p.end()));
}
