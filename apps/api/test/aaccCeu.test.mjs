/**
 * API tests for AACC CEU Tracking endpoints.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authorization (403 for client role), no-DB fallback shapes,
 * and input validation (400 for invalid category/durationMinutes/credentialType).
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
  await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

/**
 * Helper – makes an HTTP request to the local test server.
 * Defaults to an admin/practice_owner identity so most tests pass auth.
 */
async function req(path, {
  method = 'GET',
  role = 'practice_owner',
  staffId = 's-001',
  tenantId = 'system',
  body = null,
} = {}) {
  const opts = {
    method,
    headers: {
      'x-tenant-id': tenantId,
      'x-staff-role': role,
      'x-staff-id': staffId,
      'content-type': 'application/json',
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  return { status: res.status, body: parsed, rawBody: text, headers: res.headers };
}

// ─── 1. GET progress: 403 for client role ─────────────────────────────────────

test('GET /v1/staff/:staffId/aacc-ceu/progress returns 403 for client role', async () => {
  const { status } = await req('/v1/staff/s-001/aacc-ceu/progress', { role: 'client' });
  assert.equal(status, 403);
});

// ─── 2. GET progress: no-DB returns 200 with { credentialType: null } ────────

test('GET /v1/staff/:staffId/aacc-ceu/progress returns { credentialType: null } in no-DB mode', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-ceu/progress', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.equal(body.credentialType, null);
});

// ─── 3. GET entries: 403 for client role ─────────────────────────────────────

test('GET /v1/staff/:staffId/aacc-ceu/entries returns 403 for client role', async () => {
  const { status } = await req('/v1/staff/s-001/aacc-ceu/entries', { role: 'client' });
  assert.equal(status, 403);
});

// ─── 4. GET entries: no-DB returns 200 with { entries: [] } ──────────────────

test('GET /v1/staff/:staffId/aacc-ceu/entries returns { entries: [] } in no-DB mode', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-ceu/entries', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.entries));
  assert.equal(body.entries.length, 0);
});

// ─── 5. POST entry: 403 for client role ──────────────────────────────────────

test('POST /v1/staff/:staffId/aacc-ceu/entries returns 403 for client role', async () => {
  const { status } = await req('/v1/staff/s-001/aacc-ceu/entries', {
    method: 'POST',
    role: 'client',
    body: { category: 'clinical_training', durationMinutes: 60, entryDate: '2026-01-15' },
  });
  assert.equal(status, 403);
});

// ─── 6. POST entry: 400 for invalid category ─────────────────────────────────

test('POST /v1/staff/:staffId/aacc-ceu/entries returns 400 for invalid category', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-ceu/entries', {
    method: 'POST',
    role: 'practice_owner',
    body: { category: 'not_a_real_category', durationMinutes: 60, entryDate: '2026-01-15' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('category'));
});

// ─── 7. POST entry: 400 for durationMinutes = 0 ──────────────────────────────

test('POST /v1/staff/:staffId/aacc-ceu/entries returns 400 for durationMinutes = 0', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-ceu/entries', {
    method: 'POST',
    role: 'practice_owner',
    body: { category: 'clinical_training', durationMinutes: 0, entryDate: '2026-01-15' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('duration'));
});

// ─── 8. POST entry: 400 for durationMinutes > 480 ────────────────────────────

test('POST /v1/staff/:staffId/aacc-ceu/entries returns 400 for durationMinutes > 480', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-ceu/entries', {
    method: 'POST',
    role: 'practice_owner',
    body: { category: 'clinical_training', durationMinutes: 481, entryDate: '2026-01-15' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('duration') || body.error.toLowerCase().includes('480'));
});

// ─── 9. PATCH credential: 400 for invalid credentialType ─────────────────────

test('PATCH /v1/staff/:staffId/aacc-credential returns 400 for invalid credentialType', async () => {
  const { status, body } = await req('/v1/staff/s-001/aacc-credential', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { credentialType: 'made_up_credential', cycleStartDate: '2024-01-01' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('credentialtype'));
});

// ─── 10. GET renewal-report: 200 with text/html in no-DB mode ────────────────

test('GET /v1/staff/:staffId/aacc-ceu/renewal-report returns 200 text/html in no-DB mode', async () => {
  const { status, rawBody, headers } = await req('/v1/staff/s-001/aacc-ceu/renewal-report', {
    role: 'practice_owner',
  });
  assert.equal(status, 200);
  const contentType = headers.get('content-type') ?? '';
  assert.ok(contentType.includes('text/html'), `Expected text/html, got: ${contentType}`);
  assert.ok(rawBody.includes('<!doctype html') || rawBody.includes('<!DOCTYPE html'));
});
