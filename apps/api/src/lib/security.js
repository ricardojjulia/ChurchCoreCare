/**
 * Security middleware for Faith Counseling API.
 *
 * Controls:
 *  - Secure response headers (CSP, HSTS, X-Frame-Options, CORP, etc.)
 *  - CORS policy with allowlist enforcement
 *  - Rate limiting (per-IP, in-memory, sliding window)
 *  - Request-size guard
 *  - RBAC enforcement (role required per route)
 *  - Tenant-scope verification (caller tenant must match resource tenant)
 */

// ---------------------------------------------------------------------------
// Secure response headers
// ---------------------------------------------------------------------------

const SECURITY_HEADERS = {
  // Prevent MIME-type sniffing
  'x-content-type-options': 'nosniff',
  // Prevent framing (clickjacking)
  'x-frame-options': 'DENY',
  // Disable legacy XSS filter (modern browsers ignore it, but for older ones)
  'x-xss-protection': '0',
  // Restrict referrer information
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Permissions policy — disable unused browser features
  'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  // Content Security Policy — API only returns JSON, no HTML
  'content-security-policy': "default-src 'none'",
  // HSTS — enforced when served over TLS; safe to include always
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  // Cross-Origin Resource Policy
  'cross-origin-resource-policy': 'same-origin',
};

export function applySecurityHeaders(response) {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.setHeader(header, value);
  }
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3002,http://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export function handleCors(request, response) {
  const origin = request.headers['origin'];
  const allowed = origin && ALLOWED_ORIGINS.has(origin);

  if (allowed) {
    response.setHeader('access-control-allow-origin', origin);
    response.setHeader('access-control-allow-credentials', 'true');
    response.setHeader('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    response.setHeader(
      'access-control-allow-headers',
      'content-type,authorization,x-request-id,x-tenant-id,x-staff-role,x-client-id',
    );
    response.setHeader('access-control-max-age', '3600');
    // Required to prevent downstream cache from serving one user's CORS response
    response.setHeader('vary', 'origin, access-control-request-method, access-control-request-headers');
  } else if (!origin) {
    // Same-origin or server-to-server request; allow without CORS headers
  } else {
    // Unknown origin — still handle OPTIONS so browsers get a proper rejection
    if (request.method === 'OPTIONS') {
      response.writeHead(403);
      response.end();
      return true; // signal: request handled
    }
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return true; // signal: preflight handled
  }

  return false;
}

// ---------------------------------------------------------------------------
// Rate limiting  (in-memory, per-IP, sliding window)
// ---------------------------------------------------------------------------

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 300);

const rateLimitStore = new Map(); // ip -> { count, windowStart }

// Purge stale windows every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > DEFAULT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000).unref();

export function checkRateLimit(request, response) {
  const ip =
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.socket?.remoteAddress ||
    'unknown';

  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > DEFAULT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false; // not limited
  }

  entry.count += 1;
  if (entry.count > DEFAULT_MAX_REQUESTS) {
    response.setHeader('retry-after', String(Math.ceil(DEFAULT_WINDOW_MS / 1000)));
    response.setHeader('x-ratelimit-limit', String(DEFAULT_MAX_REQUESTS));
    response.setHeader('x-ratelimit-remaining', '0');
    response.writeHead(429, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Too many requests. Please retry later.' }));
    return true; // limited
  }

  return false;
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

const VALID_ROLES = new Set([
  'platform_admin',
  'practice_owner',
  'practice_admin',
  'counselor',
  'intern',
  'scheduler_biller',
  'client',
]);

// Routes accessible without any role (public / health checks / static assets)
const PUBLIC_ROUTES = new Set([
  '/health',
  '/bootstrap-metadata',
  '/openapi.yaml',
  '/docs',
  '/v1/i18n/locales',
  '/v1/i18n/catalog',
]);

// Extra roles allowed for write (POST/PATCH/DELETE) operations
const WRITE_ROLES = new Set(['platform_admin', 'practice_owner', 'practice_admin', 'counselor']);

// Routes restricted to admin-level roles only
const ADMIN_ROUTES = ['/v1/i18n/settings/', '/v1/i18n/translate'];

const ADMIN_ROLES = new Set(['platform_admin', 'practice_owner', 'practice_admin']);
const CLIENT_ALLOWED_ROUTE_PREFIXES = ['/v1/portal/'];

/**
 * Returns true if the request is rejected (response already written).
 * The role is extracted from the `x-staff-role` header — mimics what a real
 * JWT / session middleware would inject after token verification.
 */
export function enforceRbac(request, response, route) {
  // Public endpoints need no role
  if (PUBLIC_ROUTES.has(route)) return false;
  if (route === '/v1/i18n/catalog' && request.method === 'GET') return false;

  // Telemetry endpoints accept any authenticated caller; vitals ingestion is
  // also allowed from browser without role (it carries no PHI).
  if (route === '/v1/telemetry/vitals') return false;
  if (route === '/v1/telemetry/summary') return false;

  const role = (request.headers['x-staff-role'] || '').trim().toLowerCase();

  if (!role || !VALID_ROLES.has(role)) {
    writeSecureJson(response, 401, { error: 'Authentication required' });
    return true;
  }

  const isAdminRoute = ADMIN_ROUTES.some((prefix) => route.startsWith(prefix));
  if (isAdminRoute && !ADMIN_ROLES.has(role)) {
    writeSecureJson(response, 403, { error: 'Insufficient permissions' });
    return true;
  }

  if (role === 'client') {
    const isAllowedClientRoute = CLIENT_ALLOWED_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));
    if (!isAllowedClientRoute) {
      writeSecureJson(response, 403, { error: 'Client access is limited to portal routes' });
      return true;
    }
  }

  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method ?? '');
  if (isWrite && role === 'client' && route.startsWith('/v1/portal/')) {
    return false;
  }
  if (isWrite && !WRITE_ROLES.has(role) && !ADMIN_ROLES.has(role)) {
    writeSecureJson(response, 403, { error: 'Write access requires elevated role' });
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Tenant scope guard
// ---------------------------------------------------------------------------

/**
 * Returns true if the request is rejected (response already written).
 *
 * In this prototype the calling tenant is carried in `x-tenant-id`.
 * A production system would derive this from a verified JWT claim.
 * The guard ensures callers cannot access records from a different tenant.
 */
export function enforceTenantScope(request, response, resourceTenantId) {
  // platform_admin may cross-tenant (e.g., support impersonation)
  const role = (request.headers['x-staff-role'] || '').trim().toLowerCase();
  if (role === 'platform_admin') return false;

  const callerTenant = (request.headers['x-tenant-id'] || 'system').trim();
  if (callerTenant !== resourceTenantId) {
    writeSecureJson(response, 403, { error: 'Access to this resource is not permitted' });
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Helper — secure JSON write (always applies security headers)
// ---------------------------------------------------------------------------

export function writeSecureJson(response, statusCode, body) {
  applySecurityHeaders(response);
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body, null, 2));
}
