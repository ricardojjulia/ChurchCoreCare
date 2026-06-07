import { writeJson } from '../lib/http.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHost(rawHost) {
  if (!rawHost) return 'localhost';
  return String(rawHost).trim().replace(/:\d+$/, '').toLowerCase();
}

function tenantSlugFromHost(host) {
  if (!isTenantHostRoutingEnabled()) return 'system';
  if (LOCAL_HOSTS.has(host)) return 'system';
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 3) return 'system';
  return parts[0];
}

export function isTenantHostRoutingEnabled() {
  return process.env.ENABLE_TENANT_HOST_ROUTING === 'true';
}

export function isStrictTenantRoutingEnabled() {
  return process.env.TENANT_STRICT_HOST_ROUTING === 'true';
}

export function isNonLocalRuntime() {
  return process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';
}

export function resolveTenantContext(rawHost) {
  const host = normalizeHost(rawHost);
  const tenantId = tenantSlugFromHost(host);
  const isExplicitTenantHost = isTenantHostRoutingEnabled()
    && !LOCAL_HOSTS.has(host)
    && host.split('.').filter(Boolean).length >= 3;

  return {
    host,
    tenantId,
    strictMode: isStrictTenantRoutingEnabled(),
    source: isExplicitTenantHost ? 'host' : 'default',
    isExplicitTenantHost,
  };
}

export function isUnknownTenantHost(tenantContext, knownTenantSlugs) {
  if (!tenantContext?.strictMode) return false;
  if (!tenantContext?.isExplicitTenantHost) return false;
  if (!(knownTenantSlugs instanceof Set) || knownTenantSlugs.size === 0) return false;
  return !knownTenantSlugs.has(String(tenantContext.tenantId || '').toLowerCase());
}

export function denyUnknownTenantHost(response, tenantContext, knownTenantSlugs) {
  if (!isUnknownTenantHost(tenantContext, knownTenantSlugs)) return false;
  writeJson(response, 404, { error: 'Unknown tenant' });
  return true;
}

// ---------------------------------------------------------------------------
// Subscription gate exemptions
// ---------------------------------------------------------------------------

// Routes that bypass the subscription status gate regardless of tenant status.
// Suspended/churned tenants must still be able to log in, access billing to
// reactivate, access client portal for data portability, and process payments.
const SUBSCRIPTION_GATE_EXEMPT_PREFIXES = [
  '/health',        // infrastructure probes
  '/v1/auth/',      // login/logout — must work to reach billing settings
  '/v1/billing/',   // subscription status + portal — needed to reactivate
  '/v1/platform/',  // signup + platform admin (already public or admin-only)
  '/v1/portal/',    // client portal — data portability rights
  '/v1/i18n/',      // locale catalog — not tenant-specific
  '/webhooks/',     // Stripe payment webhooks — must work for suspended tenants
  '/openapi',       // API docs
  '/docs',          // API docs
  '/bootstrap',     // app bootstrap metadata
];

export function isSubscriptionGateExempt(route) {
  if (!route) return true;
  return SUBSCRIPTION_GATE_EXEMPT_PREFIXES.some((p) => route.startsWith(p));
}
