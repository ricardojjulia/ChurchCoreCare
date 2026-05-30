/**
 * API tests for Subscription Plan Limits + UI Persona endpoints.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authorization (403 for restricted roles), no-DB fallback shapes,
 * and input validation (400 for invalid persona values or missing fields).
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

// ─── 1. GET /v1/subscription/usage: 403 for counselor role ───────────────────

test('GET /v1/subscription/usage returns 403 for counselor role', async () => {
  const { status } = await req('/v1/subscription/usage', { role: 'counselor' });
  assert.equal(status, 403);
});

// ─── 2. GET /v1/subscription/usage: 403 for client role ──────────────────────

test('GET /v1/subscription/usage returns 403 for client role', async () => {
  const { status } = await req('/v1/subscription/usage', { role: 'client' });
  assert.equal(status, 403);
});

// ─── 3. GET /v1/subscription/usage: returns stub in no-DB mode (200) ─────────

test('GET /v1/subscription/usage returns stub in no-DB mode', async () => {
  const { status, body } = await req('/v1/subscription/usage', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.ok(body.plan, 'response must have plan');
  assert.equal(body.plan.planType, 'standard');
  assert.equal(body.plan.uiPersona, 'practice');
  assert.equal(body.plan.planDisplayName, 'Practice');
  assert.equal(body.plan.counselorLimit, null);
  assert.equal(body.plan.clientLimit, null);
  assert.ok(body.usage, 'response must have usage');
  assert.equal(body.usage.activeCounselors, 0);
  assert.equal(body.usage.activeClients, 0);
  assert.ok(body.grace, 'response must have grace');
  assert.equal(body.grace.counselorsInGrace, false);
  assert.equal(body.grace.clientsInGrace, false);
  assert.equal(body.grace.graceStartedAt, null);
  assert.equal(body.grace.graceDaysRemaining, null);
  assert.equal(body.grace.graceExpired, false);
  assert.ok(body.personaUpgrade, 'response must have personaUpgrade');
  assert.equal(body.personaUpgrade.dismissCount, 0);
  assert.equal(body.personaUpgrade.muted, false);
  assert.equal(body.personaUpgrade.shouldPromptUpgrade, false);
});

// ─── 4. PATCH /v1/tenant/ui-persona: 403 for counselor role ──────────────────

test('PATCH /v1/tenant/ui-persona returns 403 for counselor role', async () => {
  const { status } = await req('/v1/tenant/ui-persona', {
    method: 'PATCH',
    role: 'counselor',
    body: { persona: 'solo' },
  });
  assert.equal(status, 403);
});

// ─── 5. PATCH /v1/tenant/ui-persona: 400 for invalid persona value ───────────

test('PATCH /v1/tenant/ui-persona returns 400 for invalid persona "enterprise"', async () => {
  const { status, body } = await req('/v1/tenant/ui-persona', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { persona: 'enterprise' },
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
});

// ─── 6. PATCH /v1/tenant/ui-persona: 400 for missing persona field ───────────

test('PATCH /v1/tenant/ui-persona returns 400 when persona field is missing', async () => {
  const { status, body } = await req('/v1/tenant/ui-persona', {
    method: 'PATCH',
    role: 'practice_owner',
    body: {},
  });
  assert.equal(status, 400);
  assert.ok(typeof body.error === 'string');
});

// ─── 7. PATCH /v1/tenant/ui-persona: 200 for admin role in no-DB mode ────────

test('PATCH /v1/tenant/ui-persona returns 200 for admin role in no-DB mode', async () => {
  const { status, body } = await req('/v1/tenant/ui-persona', {
    method: 'PATCH',
    role: 'practice_owner',
    body: { persona: 'solo' },
  });
  assert.equal(status, 200);
  assert.equal(body.updated, true);
});

// ─── 8. POST /v1/tenant/persona-dismiss: 403 for counselor role ──────────────

test('POST /v1/tenant/persona-dismiss returns 403 for counselor role', async () => {
  const { status } = await req('/v1/tenant/persona-dismiss', {
    method: 'POST',
    role: 'counselor',
    body: {},
  });
  assert.equal(status, 403);
});

// ─── 9. POST /v1/tenant/persona-dismiss: 200 for admin role in no-DB mode ────

test('POST /v1/tenant/persona-dismiss returns dismissCount in no-DB mode', async () => {
  const { status, body } = await req('/v1/tenant/persona-dismiss', {
    method: 'POST',
    role: 'practice_owner',
    body: {},
  });
  assert.equal(status, 200);
  assert.equal(typeof body.dismissCount, 'number');
  assert.equal(body.muted, false);
});

// ─── 10. POST /v1/tenant/persona-dismiss: 200 with mute=true ─────────────────

test('POST /v1/tenant/persona-dismiss returns muted=true when mute flag is set', async () => {
  const { status, body } = await req('/v1/tenant/persona-dismiss', {
    method: 'POST',
    role: 'practice_owner',
    body: { mute: true },
  });
  assert.equal(status, 200);
  assert.equal(body.muted, true);
});
