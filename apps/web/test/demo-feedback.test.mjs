import test from 'node:test';
import assert from 'node:assert/strict';

let module = null;
let importError = null;
try {
  module = await import('../src/lib/demoFeedback.js');
} catch (error) {
  importError = error;
}

test('demo feedback browser module exists', () => {
  assert.equal(importError, null, 'apps/web/src/lib/demoFeedback.js must exist');
});

test('disabled controller performs no storage activity', () => {
  assert.ok(module);
  let calls = 0;
  const storage = {
    getItem() { calls += 1; return null; },
    setItem() { calls += 1; },
  };
  const controller = module.createDemoSessionController({
    enabled: false,
    storage,
  });
  assert.equal(controller.enabled, false);
  assert.equal(calls, 0);
});

test('enabled controller reuses session UUID and keeps five recent routes', () => {
  assert.ok(module);
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  let now = 1_000;
  const first = module.createDemoSessionController({
    enabled: true,
    storage,
    uuid: () => '550e8400-e29b-41d4-a716-446655440000',
    now: () => now,
  });
  for (const route of ['/one', '/two', '/three', '/four', '/five', '/six?secret=value']) {
    first.recordRoute(route);
  }
  now = 5_500;
  assert.deepEqual(first.snapshot(), {
    enabled: true,
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    breadcrumbs: ['/two', '/three', '/four', '/five', '/six'],
    sessionDurationSeconds: 4,
  });

  const second = module.createDemoSessionController({
    enabled: true,
    storage,
    uuid: () => 'should-not-be-used',
    now: () => now,
  });
  assert.equal(second.snapshot().sessionId, first.snapshot().sessionId);
});

test('submission payload includes bounded session context without identity', () => {
  assert.ok(module);
  const payload = module.buildDemoFeedbackPayload({
    session: {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      breadcrumbs: ['/dashboard'],
      sessionDurationSeconds: 21,
    },
    route: '/clients?client=secret',
    category: 'BUG',
    note: 'Please fix',
    errorMessage: null,
    demoVersion: '7.1.0',
  });
  assert.deepEqual(payload, {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/clients',
    category: 'BUG',
    errorMessage: null,
    note: 'Please fix',
    breadcrumbs: ['/dashboard'],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 21,
  });
  assert.equal('userEmail' in payload, false);
  assert.equal('fingerprint' in payload, false);
});

test('automatic reporting swallows request failures', async () => {
  assert.ok(module);
  const result = await module.submitDemoFeedback(
    validPayload(),
    {
      fetchImpl: async () => { throw new Error('offline'); },
      swallowErrors: true,
      csrfToken: 'token',
    },
  );
  assert.equal(result, null);
});

function validPayload() {
  return {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/dashboard',
    category: 'ERROR',
    errorMessage: 'Render failed',
    note: null,
    breadcrumbs: [],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 1,
  };
}
