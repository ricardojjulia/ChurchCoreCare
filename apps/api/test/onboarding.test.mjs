/**
 * API tests for the First-Time Onboarding Wizard endpoints.
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

async function req(path, { method = 'GET', role = 'practice_owner', staffId = 's-001', tenantId = 'system', body = null } = {}) {
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

// ─── GET /v1/onboarding/status ────────────────────────────────────────────────

test('GET /v1/onboarding/status returns 200 with shouldShowWizard: true for practice_owner', async () => {
  const { status, body } = await req('/v1/onboarding/status', { role: 'practice_owner' });
  assert.equal(status, 200);
  assert.equal(body.shouldShowWizard, true);
  assert.equal(body.onboardingCompleted, false);
  assert.ok(typeof body.stepsCompleted === 'object');
});

test('GET /v1/onboarding/status returns 403 for counselor role', async () => {
  const { status } = await req('/v1/onboarding/status', { role: 'counselor' });
  assert.equal(status, 403);
});

test('GET /v1/onboarding/status returns 401 with no role header', async () => {
  const res = await fetch(`${baseUrl}/v1/onboarding/status`, {
    method: 'GET',
    headers: {
      'x-tenant-id': 'system',
      'x-staff-id': 's-001',
      'content-type': 'application/json',
    },
  });
  assert.equal(res.status, 401);
});

// ─── PATCH /v1/onboarding/step/1 ─────────────────────────────────────────────

test('PATCH /v1/onboarding/step/1 returns 400 when practiceName is empty', async () => {
  const { status, body } = await req('/v1/onboarding/step/1', {
    method: 'PATCH',
    body: { practiceName: '', timezone: 'America/New_York' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('practicename'));
});

test('PATCH /v1/onboarding/step/1 returns 400 when timezone is "Fake/Zone"', async () => {
  const { status, body } = await req('/v1/onboarding/step/1', {
    method: 'PATCH',
    body: { practiceName: 'Grace Chapel', timezone: 'Fake/Zone' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('timezone'));
});

test('PATCH /v1/onboarding/step/1 returns 200 with valid body', async () => {
  const { status, body } = await req('/v1/onboarding/step/1', {
    method: 'PATCH',
    body: { practiceName: 'Grace Chapel Counseling', timezone: 'America/New_York' },
  });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

// ─── PATCH /v1/onboarding/step/2 ─────────────────────────────────────────────

test('PATCH /v1/onboarding/step/2 returns 400 when faithTradition is "unknown_tradition"', async () => {
  const { status, body } = await req('/v1/onboarding/step/2', {
    method: 'PATCH',
    body: {
      firstName: 'Jane',
      lastName: 'Doe',
      licenseType: 'lpc',
      faithTradition: 'unknown_tradition',
    },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('faithtradition'));
});

// ─── PATCH /v1/onboarding/step/3 ─────────────────────────────────────────────

test('PATCH /v1/onboarding/step/3 with { skip: true } returns { skipped: true }', async () => {
  const { status, body } = await req('/v1/onboarding/step/3', {
    method: 'PATCH',
    body: { skip: true },
  });
  assert.equal(status, 200);
  assert.equal(body.skipped, true);
});

test('PATCH /v1/onboarding/step/3 without skip and missing firstName returns 400', async () => {
  const { status, body } = await req('/v1/onboarding/step/3', {
    method: 'PATCH',
    body: { lastName: 'Smith' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('firstname'));
});

// ─── POST /v1/onboarding/complete ────────────────────────────────────────────

test('POST /v1/onboarding/complete returns { completed: true }', async () => {
  const { status, body } = await req('/v1/onboarding/complete', {
    method: 'POST',
  });
  assert.equal(status, 200);
  assert.equal(body.completed, true);
});
