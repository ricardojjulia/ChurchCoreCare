import { writeJson } from '../lib/http.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHost(rawHost) {
  if (!rawHost) return 'localhost';
  return String(rawHost).trim().replace(/:\d+$/, '').toLowerCase();
}

function parseAllowedTenantSlugs() {
  const raw = process.env.TENANT_ALLOWED_SLUGS || '';
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function tenantSlugFromHost(host) {
  if (LOCAL_HOSTS.has(host)) return 'system';
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 3) return 'system';
  return parts[0];
}

export function resolveTenantContext(rawHost) {
  const host = normalizeHost(rawHost);
  const tenantId = tenantSlugFromHost(host);
  const strictMode = process.env.TENANT_STRICT_HOST_ROUTING === 'true';
  const allowed = parseAllowedTenantSlugs();
  const isExplicitTenantHost = !LOCAL_HOSTS.has(host) && host.split('.').filter(Boolean).length >= 3;
  const unknownTenant = strictMode
    && isExplicitTenantHost
    && allowed.size > 0
    && !allowed.has(tenantId);

  return {
    host,
    tenantId,
    strictMode,
    unknownTenant,
    source: isExplicitTenantHost ? 'host' : 'default',
  };
}

export function denyUnknownTenantHost(response, tenantContext) {
  if (!tenantContext?.unknownTenant) return false;
  writeJson(response, 404, { error: 'Unknown tenant' });
  return true;
}
