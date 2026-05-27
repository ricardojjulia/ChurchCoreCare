import http from 'node:http';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  const moduleUrl = pathToFileURL(new URL('../src/index.js', import.meta.url).pathname);
  moduleUrl.searchParams.set('test', `trial-flow-${Date.now()}`);
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

// ─── GET /v1/platform/check-slug ─────────────────────────────────────────────

test('check-slug returns 400 for invalid slug format', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=AB`);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test('check-slug returns available:false for a reserved slug', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=admin`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.available, false);
  assert.equal(body.slug, 'admin');
});

test('check-slug returns available:false for existing slug (newhope)', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=newhope`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.available, false);
});

test('check-slug returns available:true for an unused slug', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=river-oaks-counseling`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.available, true);
  assert.equal(body.slug, 'river-oaks-counseling');
});

test('check-slug returns 405 for non-GET', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=test`, { method: 'POST' });
  assert.equal(res.status, 405);
});

// ─── POST /v1/platform/signup ─────────────────────────────────────────────────

test('signup returns 400 when required fields are missing', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practiceName: 'Test', slug: 'test-slug' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test('signup returns 400 for invalid slug format', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'Test Practice',
      slug: 'AB!',
      ownerEmail: 'owner@test.com',
      password: 'SecurePassword123!',
      planKey: 'solo',
    }),
  });
  assert.equal(res.status, 400);
});

test('signup returns 400 for invalid planKey', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'Test Practice',
      slug: 'valid-slug-001',
      ownerEmail: 'owner@test.com',
      password: 'SecurePassword123!',
      planKey: 'enterprise',
    }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /planKey/);
});

test('signup returns 409 when slug is already taken', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'New Hope Copy',
      slug: 'newhope',
      ownerEmail: 'owner@newhope2.test',
      password: 'SecurePassword123!',
      planKey: 'solo',
    }),
  });
  assert.equal(res.status, 409);
});

test('signup returns 409 for a reserved slug', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'My Admin Practice',
      slug: 'admin',
      ownerEmail: 'owner@test.com',
      password: 'SecurePassword123!',
      planKey: 'solo',
    }),
  });
  assert.equal(res.status, 409);
});

test('signup succeeds and creates provisioning request (in-memory mode)', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'Sunrise Counseling',
      slug: 'sunrise-counseling',
      ownerEmail: 'pastor@sunrise.test',
      password: 'SecurePassword123!',
      planKey: 'solo',
    }),
  });
  // Succeeds in in-memory mode (no Stripe required when STRIPE_SECRET_KEY absent)
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.slug, 'sunrise-counseling');
  assert.equal(body.tenantId, 'sunrise-counseling');
  assert.ok(body.trialEndsAt);
  assert.ok(body.practiceUrl.includes('sunrise-counseling'));
});

test('signup slug is now taken after first successful signup', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/check-slug?slug=sunrise-counseling`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.available, false);
});

test('signup for group plan succeeds', async () => {
  const res = await fetch(`${baseUrl}/v1/platform/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceName: 'River Oaks Group',
      slug: 'river-oaks-group',
      ownerEmail: 'admin@riveroaks.test',
      password: 'SecurePassword123!',
      planKey: 'group',
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.slug, 'river-oaks-group');
});

// ─── POST /v1/billing/subscription/activate ──────────────────────────────────

test('activate returns 401 when not authenticated', async () => {
  const res = await fetch(`${baseUrl}/v1/billing/subscription/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 401);
});

test('activate returns 503 when Stripe not configured (DB mode only) or 401 in test mode', async () => {
  // In in-memory test mode (no DB_NAME), session resolution returns null, so the
  // endpoint correctly returns 401. In DB mode with auth, it would return 503.
  // Either is acceptable here — we're verifying the route is registered.
  const savedKey = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  try {
    const res = await fetch(`${baseUrl}/v1/billing/subscription/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-role': 'practice_admin',
        'x-tenant-id': 'system',
      },
      body: JSON.stringify({}),
    });
    assert.ok(
      res.status === 401 || res.status === 503,
      `Expected 401 or 503, got ${res.status}`,
    );
  } finally {
    if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
  }
});
