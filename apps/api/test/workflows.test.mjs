/**
 * API tests for workflow recommendation history and batch endpoints.
 *
 * These tests run without a real DB (DB_NAME is not set in test mode).
 * They verify: authentication, authorization, input validation, and
 * the happy-path (no-DB) response shapes.
 *
 * In-memory fixture IDs (from apps/api/src/index.js):
 *   clients: c-001 (primaryCounselorId: s-001), c-004 (primaryCounselorId: s-001)
 *   staff:   s-001 (counselor)
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

// ─── GET /v1/workflows/recommendations/history ────────────────────────────────

test('history: 403 when client role (blocked by RBAC)', async () => {
  const { status } = await req('/v1/workflows/recommendations/history?clientId=c-001', { role: 'client' });
  assert.equal(status, 403);
});

test('history: 400 when clientId is missing', async () => {
  const { status, body } = await req('/v1/workflows/recommendations/history');
  assert.equal(status, 400);
  assert.ok(body.error.includes('clientId'));
});

test('history: 405 for POST', async () => {
  const { status } = await req('/v1/workflows/recommendations/history?clientId=c-001', { method: 'POST' });
  assert.equal(status, 405);
});

test('history: returns empty history array in no-DB mode', async () => {
  const { status, body } = await req('/v1/workflows/recommendations/history?clientId=c-001');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.history));
  assert.equal(body.history.length, 0);
});

test('history: ruleId filter is accepted without error', async () => {
  const { status } = await req('/v1/workflows/recommendations/history?clientId=c-001&ruleId=rule_safety_phq9_severe');
  assert.equal(status, 200);
});

// ─── PATCH /v1/workflows/recommendations/batch ───────────────────────────────

test('batch: 403 when client role (blocked by RBAC)', async () => {
  const { status } = await req('/v1/workflows/recommendations/batch', { method: 'PATCH', role: 'client', body: { clientId: 'c-001', rules: [] } });
  assert.equal(status, 403);
});

test('batch: 405 for GET', async () => {
  const { status } = await req('/v1/workflows/recommendations/batch', { method: 'GET' });
  assert.equal(status, 405);
});

test('batch: 400 when clientId is missing', async () => {
  const { status, body } = await req('/v1/workflows/recommendations/batch', { method: 'PATCH', body: { rules: [{ ruleId: 'r1', status: 'complete' }] } });
  assert.equal(status, 400);
  assert.ok(body.error.includes('clientId'));
});

test('batch: 400 when rules array is empty', async () => {
  const { status } = await req('/v1/workflows/recommendations/batch', { method: 'PATCH', body: { clientId: 'some-client', rules: [] } });
  assert.equal(status, 400);
});

test('batch: 400 for invalid status value', async () => {
  const { status, body } = await req('/v1/workflows/recommendations/batch', { method: 'PATCH', body: { clientId: 'c-001', rules: [{ ruleId: 'r1', status: 'not_a_status' }] } });
  assert.equal(status, 400);
  assert.ok(body.error.includes('status') || body.error.includes('not_a_status'));
});

test('batch: 200 with updated count in no-DB mode', async () => {
  const { status, body } = await req('/v1/workflows/recommendations/batch', {
    method: 'PATCH',
    body: {
      clientId: 'c-001',
      rules: [
        { ruleId: 'rule_safety_phq9_severe', status: 'complete' },
        { ruleId: 'rule_clinical_phq9_worsening', status: 'deferred' },
      ],
    },
  });
  assert.equal(status, 200);
  assert.equal(typeof body.updated, 'number');
  assert.equal(body.updated, 2);
});

test('batch: 400 when rules exceeds 100 items', async () => {
  const rules = Array.from({ length: 101 }, (_, i) => ({ ruleId: `rule_${i}`, status: 'complete' }));
  const { status } = await req('/v1/workflows/recommendations/batch', { method: 'PATCH', body: { clientId: 'some-client', rules } });
  assert.equal(status, 400);
});
