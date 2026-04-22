/**
 * MySQL pool access layer.
 *
 * This module remains backward compatible for all existing query modules while
 * enabling tenant-aware pool resolution via AsyncLocalStorage context.
 */

import {
  getActivePool,
  getPoolForTenant,
  runWithTenantContext,
  getTenantContext,
  closeAllPools,
} from './pools.js';

const pool = {
  query(...args) {
    return getActivePool().query(...args);
  },
  execute(...args) {
    return getActivePool().execute(...args);
  },
  getConnection(...args) {
    return getActivePool().getConnection(...args);
  },
  end(...args) {
    return getActivePool().end(...args);
  },
};

// Verify connectivity at startup so misconfigured DB_* vars surface immediately.
export async function verifyConnection(tenantId = 'system') {
  const conn = await getPoolForTenant(tenantId).getConnection();
  await conn.ping();
  conn.release();
}

export { runWithTenantContext, getTenantContext, closeAllPools };
export default pool;
