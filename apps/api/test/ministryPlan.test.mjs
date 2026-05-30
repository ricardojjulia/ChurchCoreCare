/**
 * API tests for Ministry Plan endpoints.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authorization (403 for restricted roles), no-DB fallback shapes,
 * and input validation (400 for invalid denomination / churchSize / scholarshipFlag).
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

// ─── 1. GET church-identity: 403 for client role ──────────────────────────────

test('GET /v1/practices/:id/church-identity returns 403 for client role', async () => {
  const { status } = await req('/v1/practices/p-001/church-identity', { role: 'client' });
  assert.equal(status, 403);
});

// ─── 2. GET church-identity: no-DB returns null fields (200) ─────────────────

test('GET /v1/practices/:id/church-identity returns null fields in no-DB mode', async () => {
  const { status, body } = await req('/v1/practices/p-001/church-identity', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.equal(body.ministryName, null);
  assert.equal(body.denomination, null);
  assert.equal(body.churchSize, null);
  assert.equal(body.parentOrganization, null);
  assert.equal(body.churchDirectoryUrlPattern, null);
});

// ─── 3. PATCH church-identity: 403 for counselor role ────────────────────────

test('PATCH /v1/practices/:id/church-identity returns 403 for counselor role', async () => {
  const { status } = await req('/v1/practices/p-001/church-identity', {
    method: 'PATCH',
    role: 'counselor',
    body: { denomination: 'nondenominational' },
  });
  assert.equal(status, 403);
});

// ─── 4. PATCH church-identity: 400 for invalid denomination ──────────────────

test('PATCH /v1/practices/:id/church-identity returns 400 for invalid denomination', async () => {
  const { status, body } = await req('/v1/practices/p-001/church-identity', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { denomination: 'made_up_denomination' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('denomination'));
});

// ─── 5. PATCH church-identity: 400 for invalid churchSize ────────────────────

test('PATCH /v1/practices/:id/church-identity returns 400 for invalid churchSize', async () => {
  const { status, body } = await req('/v1/practices/p-001/church-identity', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { churchSize: 'giant' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('churchsize'));
});

// ─── 6. PATCH scholarship: 403 for counselor role ────────────────────────────

test('PATCH /v1/clients/:id/scholarship returns 403 for counselor role', async () => {
  const { status } = await req('/v1/clients/c-001/scholarship', {
    method: 'PATCH',
    role: 'counselor',
    body: { scholarshipFlag: true },
  });
  assert.equal(status, 403);
});

// ─── 7. PATCH scholarship: 400 when scholarshipFlag is not boolean ────────────

test('PATCH /v1/clients/:id/scholarship returns 400 when scholarshipFlag is a string', async () => {
  const { status, body } = await req('/v1/clients/c-001/scholarship', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { scholarshipFlag: 'yes' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
  assert.ok(body.error.toLowerCase().includes('scholarshipflag'));
});

// ─── 8. PATCH church-directory-ref: 403 for client role ──────────────────────

test('PATCH /v1/clients/:id/church-directory-ref returns 403 for client role', async () => {
  const { status } = await req('/v1/clients/c-001/church-directory-ref', {
    method: 'PATCH',
    role: 'client',
    body: { churchDirectoryId: 'dir-001', churchDirectorySource: 'elvanto' },
  });
  assert.equal(status, 403);
});

// ─── 9. GET ministry/summary: 403 for counselor role ─────────────────────────

test('GET /v1/ministry/summary returns 403 for counselor role', async () => {
  const { status } = await req('/v1/ministry/summary', { role: 'counselor' });
  assert.equal(status, 403);
});

// ─── 10. GET ministry/summary: no-DB mode returns 0-counts (200) ─────────────

test('GET /v1/ministry/summary returns 0-counts in no-DB mode', async () => {
  const { status, body } = await req('/v1/ministry/summary', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.equal(body.totalClients, 0);
  assert.equal(body.scholarshipClients, 0);
  assert.equal(body.totalCounselors, 0);
});
