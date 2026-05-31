/**
 * API tests for client self-scheduling endpoints.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authentication, authorization, validation, portal session,
 * and method-level guards.
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

// ─── Staff helper ─────────────────────────────────────────────────────────────

async function staffReq(path, { method = 'GET', role = 'counselor', staffId = 's-001', tenantId = 'system', body = null } = {}) {
  const opts = {
    method,
    headers: {
      'x-tenant-id':   tenantId,
      'x-staff-role':  role,
      'x-staff-id':    staffId,
      'content-type':  'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// ─── Portal helper ────────────────────────────────────────────────────────────
// Portal endpoints authenticate via the session cookie in production.
// In test mode (no DB) we fall back to the x-client-id header (same pattern
// as x-staff-role for staff endpoints).

async function portalReq(path, { method = 'GET', clientId = 'c-001', tenantId = 'system', body = null } = {}) {
  const opts = {
    method,
    headers: {
      'x-tenant-id':   tenantId,
      'x-staff-role':  'client',       // signals client/portal role
      'x-client-id':   clientId,       // portal client identity in dev mode
      'content-type':  'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// ─── Test 1: GET scheduling profile → 200 with item:null in no-DB mode ────────

test('GET scheduling profile: returns 200 with item:null in no-DB mode', async () => {
  const { status, body } = await staffReq('/v1/staff/s-001/scheduling-profile', {
    role: 'counselor',
    staffId: 's-001',
  });
  assert.equal(status, 200);
  assert.equal(body.item, null);
});

// ─── Test 2: PUT scheduling profile → 400 for invalid slotDurationMinutes ─────

test('PUT scheduling profile: 400 for invalid slotDurationMinutes', async () => {
  const { status, body } = await staffReq('/v1/staff/s-001/scheduling-profile', {
    method:  'PUT',
    role:    'counselor',
    staffId: 's-001',
    body: {
      enabled:             true,
      slotDurationMinutes: 99, // invalid — not in [30,45,50]
    },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('slotdurationminutes'), `expected error about slotDurationMinutes, got: ${body.error}`);
});

// ─── Test 3: PUT scheduling profile → 403 when counselor updates another's ────

test('PUT scheduling profile: 403 when counselor updates another counselors profile', async () => {
  const { status, body } = await staffReq('/v1/staff/s-002/scheduling-profile', {
    method:  'PUT',
    role:    'counselor',
    staffId: 's-001',  // different from target s-002
    body: {
      enabled:             false,
      slotDurationMinutes: 50,
    },
  });
  assert.equal(status, 403);
  assert.ok(body.error, 'should have an error message');
});

// ─── Test 4: PUT booking authorization → 403 for client role ─────────────────

test('PUT booking authorization: 403 for client role', async () => {
  const { status, body } = await staffReq('/v1/clients/c-001/booking-authorization', {
    method: 'PUT',
    role:   'client',  // client role is blocked
    body: { counselorId: 's-001', bookingMode: 'book' },
  });
  assert.equal(status, 403);
  assert.ok(body.error, 'should have an error message');
});

// ─── Test 5: PUT booking authorization → 400 when bookingMode is invalid ─────

test('PUT booking authorization: 400 when bookingMode is invalid', async () => {
  const { status, body } = await staffReq('/v1/clients/c-001/booking-authorization', {
    method:  'PUT',
    role:    'practice_admin',
    staffId: 's-001',
    body: { counselorId: 's-001', bookingMode: 'invalid_mode' },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('bookingmode'), `expected bookingMode error, got: ${body.error}`);
});

// ─── Test 6: GET portal entitlement → 401 with no portal session ─────────────

test('GET portal entitlement: 401 with no portal session header', async () => {
  // Send without any client identity headers
  const res = await fetch(`${baseUrl}/v1/portal/scheduling/entitlement`, {
    method: 'GET',
    headers: {
      'x-tenant-id':  'system',
      'x-staff-role': 'client',
      // deliberately omit x-client-id
      'content-type': 'application/json',
    },
  });
  assert.equal(res.status, 401);
});

// ─── Test 7: POST portal book → 405 for GET method ───────────────────────────

test('POST portal book: 405 for GET method', async () => {
  const { status } = await portalReq('/v1/portal/scheduling/book', {
    method: 'GET',
  });
  assert.equal(status, 405);
});

// ─── Test 8: POST portal book → 400 when slotStart is missing ────────────────

test('POST portal book: 400 when slotStart is missing', async () => {
  const { status, body } = await portalReq('/v1/portal/scheduling/book', {
    method: 'POST',
    body: {
      counselorId: 's-001',
      apptType:    'individual',
      // slotStart is intentionally omitted
      slotEnd:     new Date(Date.now() + 60 * 60_000).toISOString(),
    },
  });
  assert.equal(status, 400);
  assert.ok(body.error.toLowerCase().includes('slotstart'), `expected slotStart error, got: ${body.error}`);
});
