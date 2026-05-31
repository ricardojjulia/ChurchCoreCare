/**
 * API tests for POST /v1/i18n/locales (createLocale).
 *
 * Runs without a real DB (file-based locale store only).
 * Covers: RBAC (403 for non-admin roles), validation (400 for missing/unsupported locale),
 * and happy-path creation (200 for practice_admin with a valid locale).
 */
import http from 'node:http';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  const { handleApiRequest } = await import('../src/index.js');
  server = http.createServer(handleApiRequest);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  delete process.env.FAITH_API_DISABLE_LISTEN;
  if (!server) return;
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

/**
 * Helper — makes an HTTP request to the test server.
 */
async function req(path, { method = 'GET', role = 'practice_admin', body = null } = {}) {
  const opts = {
    method,
    headers: {
      'x-tenant-id': 'system',
      'x-staff-role': role,
      'x-staff-id': 's-001',
      'content-type': 'application/json',
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch { /* non-JSON body */ }
  return { status: res.status, body: parsed };
}

// ─── 1. 403 for counselor role ────────────────────────────────────────────────

test('POST /v1/i18n/locales returns 403 for counselor role', async () => {
  const { status } = await req('/v1/i18n/locales', {
    method: 'POST',
    role: 'counselor',
    body: { locale: 'es-MX' },
  });
  assert.equal(status, 403);
});

// ─── 2. 403 for client role ───────────────────────────────────────────────────

test('POST /v1/i18n/locales returns 403 for client role', async () => {
  const { status } = await req('/v1/i18n/locales', {
    method: 'POST',
    role: 'client',
    body: { locale: 'es-MX' },
  });
  assert.equal(status, 403);
});

// ─── 3. 400 when locale field is missing ──────────────────────────────────────

test('POST /v1/i18n/locales returns 400 when locale field is missing', async () => {
  const { status, body } = await req('/v1/i18n/locales', {
    method: 'POST',
    role: 'practice_admin',
    body: { label: 'Some Language' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('locale'));
});

// ─── 4. 400 for unsupported locale code ──────────────────────────────────────

test('POST /v1/i18n/locales returns 400 for unsupported locale code', async () => {
  const { status, body } = await req('/v1/i18n/locales', {
    method: 'POST',
    role: 'practice_admin',
    body: { locale: 'xx-XX' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('xx-xx') || body.error.toLowerCase().includes('supported'));
});

// ─── 5. 200 for practice_admin with valid locale ──────────────────────────────

test('POST /v1/i18n/locales returns 200 for practice_admin with valid locale', async () => {
  const { status, body } = await req('/v1/i18n/locales', {
    method: 'POST',
    role: 'practice_admin',
    body: { locale: 'fr-FR' },
  });
  assert.equal(status, 200);
  assert.ok(typeof body.created === 'boolean');
  assert.equal(body.locale, 'fr-FR');
  assert.ok(typeof body.label === 'string' && body.label.length > 0);
});
