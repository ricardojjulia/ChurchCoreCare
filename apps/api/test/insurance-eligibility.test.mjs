/**
 * Tests for the insurance eligibility verification endpoints.
 *
 * GET  /v1/clients/:clientId/insurance/:insuranceId/verify-eligibility  → cached result
 * POST /v1/clients/:clientId/insurance/:insuranceId/verify-eligibility  → fresh check
 *
 * In test mode (no STEDI_API_KEY, no DB_NAME), the handlers return safe error
 * codes without hitting the clearinghouse.
 */

import http from 'node:http';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  const moduleUrl = pathToFileURL(new URL('../src/index.js', import.meta.url).pathname);
  moduleUrl.searchParams.set('test', `eligibility-${Date.now()}`);
  const { handleApiRequest } = await import(moduleUrl.href);

  server = http.createServer(handleApiRequest);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  delete process.env.FAITH_API_DISABLE_LISTEN;
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

const CLIENT_ID = 'client-001';
const INS_ID    = 'ins-001';
const eligUrl   = () => `${baseUrl}/v1/clients/${CLIENT_ID}/insurance/${INS_ID}/verify-eligibility`;
const AUTH_HDR  = { 'x-staff-role': 'counselor', 'x-tenant-id': 'system', cookie: 'session=fake' };

// ─── RBAC — unauthenticated ───────────────────────────────────────────────────

test('GET verify-eligibility returns 401 without auth', async () => {
  const res = await fetch(eligUrl());
  assert.equal(res.status, 401);
});

test('POST verify-eligibility returns 401 without auth', async () => {
  const res = await fetch(eligUrl(), { method: 'POST' });
  assert.equal(res.status, 401);
});

// ─── STEDI not configured ─────────────────────────────────────────────────────

test('POST verify-eligibility returns 503 or 404 when STEDI_API_KEY not set', async () => {
  const savedKey = process.env.STEDI_API_KEY;
  delete process.env.STEDI_API_KEY;
  try {
    const res = await fetch(eligUrl(), { method: 'POST', headers: AUTH_HDR });
    // 503 when STEDI not configured; 404 when insurance billing is not enabled for this practice
    assert.ok(res.status === 503 || res.status === 404, `expected 503 or 404, got ${res.status}`);
    const body = await res.json();
    assert.ok(body.error);
  } finally {
    if (savedKey !== undefined) process.env.STEDI_API_KEY = savedKey;
  }
});

test('GET verify-eligibility returns 503 or 404 when STEDI_API_KEY not set', async () => {
  const savedKey = process.env.STEDI_API_KEY;
  delete process.env.STEDI_API_KEY;
  try {
    const res = await fetch(eligUrl(), { headers: AUTH_HDR });
    // 503 when STEDI not configured; 404 when insurance billing is not enabled for this practice
    assert.ok(res.status === 503 || res.status === 404, `expected 503 or 404, got ${res.status}`);
    const body = await res.json();
    assert.ok(body.error);
  } finally {
    if (savedKey !== undefined) process.env.STEDI_API_KEY = savedKey;
  }
});

// ─── Method enforcement ───────────────────────────────────────────────────────

test('PUT verify-eligibility returns 404, 405, or 503', async () => {
  const res = await fetch(eligUrl(), { method: 'PUT', headers: AUTH_HDR });
  // 404 when insurance billing not enabled; 405 method not allowed; 503 Stedi not configured
  assert.ok(res.status === 404 || res.status === 405 || res.status === 503, `unexpected status: ${res.status}`);
});

// ─── Response shape when STEDI configured but no DB ──────────────────────────

test('GET verify-eligibility with STEDI key set returns non-401 shape', async () => {
  const savedKey = process.env.STEDI_API_KEY;
  process.env.STEDI_API_KEY = 'test_key_placeholder';
  try {
    const res = await fetch(eligUrl(), { headers: AUTH_HDR });
    // In in-memory mode, client lookup may 404 but should not 401 or 500
    assert.ok(res.status !== 401, 'should not be 401 when authenticated');
    assert.ok(res.status < 500, `unexpected server error: ${res.status}`);
  } finally {
    if (savedKey !== undefined) process.env.STEDI_API_KEY = savedKey;
    else delete process.env.STEDI_API_KEY;
  }
});

test('POST verify-eligibility with STEDI key set returns non-401 shape', async () => {
  const savedKey = process.env.STEDI_API_KEY;
  process.env.STEDI_API_KEY = 'test_key_placeholder';
  try {
    const res = await fetch(eligUrl(), { method: 'POST', headers: AUTH_HDR });
    assert.ok(res.status !== 401, 'should not be 401 when authenticated');
    // 404 (client not found in memory) or 503 (stedi call failed) are both acceptable
    assert.ok([200, 404, 503].includes(res.status), `unexpected status: ${res.status}`);
  } finally {
    if (savedKey !== undefined) process.env.STEDI_API_KEY = savedKey;
    else delete process.env.STEDI_API_KEY;
  }
});
