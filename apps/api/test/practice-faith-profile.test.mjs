/**
 * API tests for GET /v1/practice/faith-profile and PUT /v1/practice/faith-profile.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authentication, authorization, input validation, and
 * the happy-path (no-DB) response shapes.
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

async function req(path, { method = 'GET', role = 'counselor', staffId = 's-001', tenantId = 'system', body = null } = {}) {
  const opts = {
    method,
    headers: {
      'x-tenant-id': tenantId,
      'x-staff-role': role,
      'x-staff-id': staffId,
      'content-type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const VALID_BODY = {
  tradition: 'evangelical_baptist',
  vocabularyPreset: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'evangelical',
  },
  defaultIntegrationLevel: 'preferred',
};

// ─── GET /v1/practice/faith-profile ──────────────────────────────────────────

test('GET: 200 with item: null in no-DB mode (counselor role)', async () => {
  const { status, body } = await req('/v1/practice/faith-profile', { role: 'counselor' });
  assert.equal(status, 200);
  assert.equal(body.item, null);
});

test('GET: 403 for client role', async () => {
  const { status } = await req('/v1/practice/faith-profile', { role: 'client' });
  assert.equal(status, 403);
});

test('GET: 401 when no role header', async () => {
  // Send request without the x-staff-role header
  const res = await fetch(`${baseUrl}/v1/practice/faith-profile`, {
    method: 'GET',
    headers: {
      'x-tenant-id': 'system',
      'x-staff-id': 's-001',
      'content-type': 'application/json',
    },
  });
  assert.equal(res.status, 401);
});

// ─── PUT /v1/practice/faith-profile ──────────────────────────────────────────

test('PUT: 403 for counselor role', async () => {
  const { status } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'counselor',
    body: VALID_BODY,
  });
  assert.equal(status, 403);
});

test('PUT: 400 when tradition is missing', async () => {
  const { tradition: _omit, ...bodyWithoutTradition } = VALID_BODY;
  const { status, body } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    body: bodyWithoutTradition,
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('tradition'));
});

test('PUT: 400 when tradition is invalid', async () => {
  const { status, body } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    body: { ...VALID_BODY, tradition: 'not_a_real_tradition' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('tradition'));
});

test('PUT: 400 when vocabularyPreset is missing', async () => {
  const { vocabularyPreset: _omit, ...bodyWithoutVp } = VALID_BODY;
  const { status, body } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    body: bodyWithoutVp,
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('vocabularypreset'));
});

test('PUT: 400 when defaultIntegrationLevel is invalid', async () => {
  const { status, body } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    body: { ...VALID_BODY, defaultIntegrationLevel: 'not_valid' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('defaultintegrationlevel'));
});

test('PUT: 200 in no-DB mode with practice_admin role', async () => {
  const { status, body } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    body: VALID_BODY,
  });
  assert.equal(status, 200);
  assert.ok(body.item, 'item should be present');
  assert.equal(body.item.tradition, 'evangelical_baptist');
  assert.equal(body.item.defaultIntegrationLevel, 'preferred');
  assert.equal(typeof body.item.vocabularyPreset, 'object');
  assert.equal(typeof body.item.contentGuidelinesConfigured, 'boolean');
  assert.equal(typeof body.item.updatedAt, 'string');
  // Must never expose the encrypted value
  assert.equal(body.item.contentGuidelinesEnc, undefined);
  assert.equal(body.item.content_guidelines_enc, undefined);
});

test('PUT: body tenantId is ignored (tenant from session only)', async () => {
  const bodyWithInjectedTenant = { ...VALID_BODY, tenantId: 'evil-tenant' };
  const { status } = await req('/v1/practice/faith-profile', {
    method: 'PUT',
    role: 'practice_admin',
    tenantId: 'system',
    body: bodyWithInjectedTenant,
  });
  // Should succeed; tenantId in body is silently ignored, not a validation error
  assert.equal(status, 200);
});
