/**
 * Tenant-aware MySQL pool registry.
 *
 * Default behavior remains backward compatible with the existing single-DB
 * configuration. Tenant-specific pools are only used when explicit tenant DB
 * configuration is provided via TENANT_DB_MAP.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import mysql from 'mysql2/promise';

const tenantContextStorage = new AsyncLocalStorage();
const poolRegistry = new Map();

function parseSslEnabled(value) {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function buildPoolConfig(config) {
  return {
    host: config.host || '127.0.0.1',
    port: Number(config.port || 3306),
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: parseSslEnabled(config.ssl) ? { rejectUnauthorized: true } : false,
    waitForConnections: true,
    connectionLimit: Number(config.connectionLimit || 10),
    queueLimit: 0,
    timezone: 'Z',
    decimalNumbers: true,
    connectTimeout: 10_000,
  };
}

function defaultDbConfigFromEnv() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL,
  };
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

function resolveTenantDbConfig(tenantId) {
  const tenantMap = parseTenantDbMap();
  if (tenantId && tenantMap[tenantId]) {
    return tenantMap[tenantId];
  }
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
  if (poolRegistry.has(key)) {
    return poolRegistry.get(key);
  }

  const config = resolveTenantDbConfig(key);
  const pool = mysql.createPool(buildPoolConfig(config));
  poolRegistry.set(key, pool);
  return pool;
}

export function getActivePool() {
  const context = getTenantContext();
  const tenantId = context?.tenantId || 'system';
  return getPoolForTenant(tenantId);
}

export async function closeAllPools() {
  const pools = [...poolRegistry.values()];
  poolRegistry.clear();
  await Promise.allSettled(pools.map((pool) => pool.end()));
}
