/**
 * Auth smoke test — catches session-validation regressions against a real DB.
 *
 * Runs the full auth cycle: login → authenticated fetch → logout → verify revoked.
 * Uses real session cookies, not header-based dev bypasses.
 *
 * Usage:
 *   node ops/smoke-auth.mjs
 *
 * Env vars (all optional — defaults match the dev seed):
 *   SMOKE_API_URL   Base URL of the API process  (default: http://127.0.0.1:3101)
 *   SMOKE_EMAIL     Staff account email           (default: admin@churchcorecare.local)
 *   SMOKE_PASSWORD  Staff account password        (default: ChangeMe!Dev2024#)
 *
 * Exit 0 = all checks passed.
 * Exit 1 = one or more checks failed.
 */

const BASE  = (process.env.SMOKE_API_URL  || 'http://127.0.0.1:3101').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL     || 'admin@churchcorecare.local';
const PASS  = process.env.SMOKE_PASSWORD  || 'ChangeMe!Dev2024#';

let failures = 0;

function pass(label) {
  console.log(`  ✓  ${label}`);
}

function fail(label, detail) {
  console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`);
  failures++;
}

/** Parse Set-Cookie headers from a Response and return a cookie string. */
function extractCookies(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

/** Merge two cookie-jar strings (later values win for duplicate names). */
function mergeCookies(existing, incoming) {
  const map = new Map();
  for (const part of (existing + '; ' + incoming).split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) map.set(name, value);
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(path, { method = 'GET', cookies = '', body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (cookies) headers.cookie = cookies;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const newCookies = extractCookies(response);
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  return { status: response.status, json, newCookies };
}

async function main() {
  console.log(`\nSmoke test — ${BASE}\n`);

  // ── 1. Health check ──────────────────────────────────────────────────────
  {
    const { status, json } = await request('/health');
    status === 200 && json?.status === 'ok'
      ? pass('GET /health → ok')
      : fail('GET /health', `status=${status} body=${JSON.stringify(json)}`);
  }

  // ── 2. Login ─────────────────────────────────────────────────────────────
  let cookies = '';
  let role = null;
  {
    const { status, json, newCookies } = await request('/v1/auth/login', {
      method: 'POST',
      body: { email: EMAIL, password: PASS },
    });
    cookies = mergeCookies(cookies, newCookies);
    role = json?.profile?.role ?? null;

    status === 200 && role
      ? pass(`POST /v1/auth/login → role=${role}`)
      : fail('POST /v1/auth/login', `status=${status} body=${JSON.stringify(json)}`);
  }

  if (failures > 0) {
    console.error('\nLogin failed — skipping authenticated checks.\n');
    process.exit(1);
  }

  // ── 3. Authenticated data fetch — /v1/clients ────────────────────────────
  {
    const { status, json } = await request('/v1/clients', { cookies });
    status === 200 && Array.isArray(json?.items) && !json?.error
      ? pass('GET /v1/clients → authenticated, items array returned')
      : fail('GET /v1/clients', `status=${status} body=${JSON.stringify(json)}`);
  }

  // ── 4. Authenticated data fetch — /v1/operations/summary ────────────────
  {
    const { status, json } = await request('/v1/operations/summary', { cookies });
    status === 200 && json?.summary && !json?.error
      ? pass('GET /v1/operations/summary → authenticated, summary returned')
      : fail('GET /v1/operations/summary', `status=${status} body=${JSON.stringify(json)}`);
  }

  // ── 5. Session identity check ─────────────────────────────────────────────
  {
    const { status, json } = await request('/v1/auth/me', { cookies });
    status === 200 && json?.role
      ? pass(`GET /v1/auth/me → role=${json.role}`)
      : fail('GET /v1/auth/me', `status=${status} body=${JSON.stringify(json)}`);
  }

  // ── 6. Logout ─────────────────────────────────────────────────────────────
  {
    const { status, json, newCookies } = await request('/v1/auth/logout', {
      method: 'POST',
      cookies,
    });
    cookies = mergeCookies(cookies, newCookies);
    status === 200
      ? pass('POST /v1/auth/logout → ok')
      : fail('POST /v1/auth/logout', `status=${status} body=${JSON.stringify(json)}`);
  }

  // ── 7. Revoked session must not authenticate ──────────────────────────────
  {
    const { status } = await request('/v1/clients', { cookies });
    status === 401 || status === 403
      ? pass(`GET /v1/clients after logout → ${status} (session revoked)`)
      : fail('GET /v1/clients after logout', `expected 401/403, got ${status}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  if (failures === 0) {
    console.log('All smoke checks passed.\n');
    process.exit(0);
  } else {
    console.error(`${failures} smoke check(s) failed.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nSmoke test crashed:', err.message || err);
  process.exit(1);
});
