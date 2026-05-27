import http from 'node:http';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  const moduleUrl = pathToFileURL(new URL('../src/index.js', import.meta.url).pathname);
  moduleUrl.searchParams.set('test', `sub-gate-${Date.now()}`);
  const { handleApiRequest } = await import(moduleUrl.href);

  server = http.createServer(handleApiRequest);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  delete process.env.FAITH_API_DISABLE_LISTEN;
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => { if (error) reject(error); else resolve(); });
  });
});

// Helper — request with injected role + tenant (dev header fallback, no real session in test mode)
function staffReq(path, tenantId, role, method = 'GET') {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'x-staff-role': role,
      'x-tenant-id': tenantId,
      'content-type': 'application/json',
    },
  });
}

// ─── Blocked: suspended tenant ────────────────────────────────────────────────

test('suspended tenant receives 402 on gated route', async () => {
  const res = await staffReq('/v1/staff', 'suspended-test', 'practice_admin');
  assert.equal(res.status, 402);
  const body = await res.json();
  assert.equal(body.subscriptionStatus, 'suspended');
  assert.ok(body.billingUrl);
});

test('suspended tenant blocked on write (POST) gated route', async () => {
  const res = await staffReq('/v1/staff', 'suspended-test', 'practice_admin', 'POST');
  assert.equal(res.status, 402);
});

// ─── Blocked: trial-expired tenant ────────────────────────────────────────────

test('trial-expired tenant receives 402 on gated route', async () => {
  const res = await staffReq('/v1/staff', 'trial-expired-test', 'practice_admin');
  assert.equal(res.status, 402);
  const body = await res.json();
  assert.equal(body.subscriptionStatus, 'trial');
  assert.ok(body.billingUrl);
});

// ─── Allowed: active tenant ────────────────────────────────────────────────────

test('active tenant passes gate on gated route', async () => {
  const res = await staffReq('/v1/staff', 'system', 'practice_admin');
  assert.notEqual(res.status, 402);
});

// ─── Allowed: platform_admin bypasses gate ─────────────────────────────────────

test('platform_admin bypasses gate even for suspended tenant', async () => {
  const res = await staffReq('/v1/staff', 'suspended-test', 'platform_admin');
  assert.notEqual(res.status, 402);
});

// ─── Exempt routes: suspended tenant can still reach these ────────────────────

test('auth routes are exempt — suspended tenant can reach login endpoint', async () => {
  // POST /v1/auth/login with no body → 400 (bad request), NOT 402
  const res = await fetch(`${baseUrl}/v1/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': 'suspended-test',
    },
    body: JSON.stringify({}),
  });
  assert.notEqual(res.status, 402);
});

test('billing routes are exempt — suspended tenant can reach subscription status', async () => {
  // GET /v1/billing/subscription requires session (returns 401 in test mode), NOT 402
  const res = await staffReq('/v1/billing/subscription', 'suspended-test', 'practice_admin');
  assert.notEqual(res.status, 402);
});

test('health endpoint is exempt — always reachable regardless of subscription', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
});

test('portal routes are exempt — clients retain portal access on suspended tenant', async () => {
  // GET /v1/portal/public-config is public; should never be 402
  const res = await fetch(`${baseUrl}/v1/portal/public-config?tenantId=suspended-test`);
  assert.notEqual(res.status, 402);
});
