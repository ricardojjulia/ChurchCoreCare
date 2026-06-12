import test from 'node:test';
import assert from 'node:assert/strict';

let feedbackModule = null;
let importError = null;

try {
  feedbackModule = await import('../src/lib/demo-feedback.js');
} catch (error) {
  importError = error;
}

test('demo feedback service module exists', () => {
  assert.equal(importError, null, 'apps/api/src/lib/demo-feedback.js must exist');
});

test('validates and normalizes a bounded demo feedback submission', () => {
  assert.ok(feedbackModule);
  const result = feedbackModule.validateDemoFeedbackSubmission({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '  /clients?clientId=secret  ',
    category: 'BUG',
    errorMessage: '  Unexpected   result  ',
    note: '  Please fix this.  ',
    breadcrumbs: ['/dashboard?token=secret', ' /clients '],
    demoVersion: '  7.1.0  ',
    sessionDurationSeconds: 42,
    userEmail: 'forged@example.test',
    userRole: 'platform_admin',
    fingerprint: 'forged',
  });

  assert.deepEqual(result, {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/clients',
    category: 'BUG',
    errorMessage: 'Unexpected result',
    note: 'Please fix this.',
    breadcrumbs: ['/dashboard', '/clients'],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 42,
  });
});

test('rejects invalid categories and field bounds', () => {
  assert.ok(feedbackModule);
  const base = {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/dashboard',
    category: 'BUG',
    breadcrumbs: [],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 0,
  };

  assert.throws(
    () => feedbackModule.validateDemoFeedbackSubmission({ ...base, category: 'OTHER' }),
    /category/i,
  );
  assert.throws(
    () => feedbackModule.validateDemoFeedbackSubmission({ ...base, note: 'x'.repeat(2001) }),
    /note/i,
  );
  assert.throws(
    () => feedbackModule.validateDemoFeedbackSubmission({
      ...base,
      breadcrumbs: Array.from({ length: 6 }, (_, index) => `/route-${index}`),
    }),
    /breadcrumbs/i,
  );
  assert.throws(
    () => feedbackModule.validateDemoFeedbackSubmission({
      ...base,
      sessionDurationSeconds: 2_592_001,
    }),
    /duration/i,
  );
});

test('equivalent normalized automatic errors share a fingerprint', () => {
  assert.ok(feedbackModule);
  const first = feedbackModule.computeDemoFeedbackFingerprint({
    route: '/Clients?clientId=one',
    category: 'ERROR',
    errorMessage: ' Render   Failed ',
    note: null,
  });
  const second = feedbackModule.computeDemoFeedbackFingerprint({
    route: '/clients?clientId=two',
    category: 'ERROR',
    errorMessage: 'render failed',
    note: 'ignored for automatic errors',
  });

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('materially different manual notes produce different fingerprints', () => {
  assert.ok(feedbackModule);
  const first = feedbackModule.computeDemoFeedbackFingerprint({
    route: '/dashboard',
    category: 'IMPROVEMENT',
    note: 'Add a compact view',
  });
  const second = feedbackModule.computeDemoFeedbackFingerprint({
    route: '/dashboard',
    category: 'IMPROVEMENT',
    note: 'Add a calendar view',
  });

  assert.notEqual(first, second);
});

test('service derives authenticated identity and writes through the system database', async () => {
  assert.ok(feedbackModule);
  const tenantQueries = [];
  const systemQueries = [];
  const tenantPool = {
    async query(sql, params) {
      tenantQueries.push({ sql, params });
      return [[{ email_enc: 'encrypted-email' }]];
    },
  };
  const systemPool = {
    async query(sql, params) {
      systemQueries.push({ sql, params });
      return [[{ report_id: '11111111-1111-4111-8111-111111111111', hit_count: 1, rate_limited: false }]];
    },
  };
  const service = feedbackModule.createDemoFeedbackService({
    tenantPool,
    systemPool,
    encrypt: (value) => value == null ? null : `enc(${value})`,
    decrypt: (value) => value === 'encrypted-email' ? 'person@example.test' : null,
  });

  const result = await service.submit({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/dashboard',
    category: 'BUG',
    note: 'Button is missing',
    breadcrumbs: ['/dashboard'],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 90,
    userEmail: 'forged@example.test',
    fingerprint: 'forged',
  }, {
    staff_account_id: 'staff-1',
    tenant_id: 'tenant-a',
    role: 'counselor',
  });

  assert.deepEqual(result, {
    id: '11111111-1111-4111-8111-111111111111',
    hitCount: 1,
  });
  assert.match(tenantQueries[0].sql, /staff_accounts/i);
  assert.match(systemQueries[0].sql, /submit_demo_feedback/i);
  assert.ok(systemQueries[0].params.includes('enc(person@example.test)'));
  assert.ok(systemQueries[0].params.includes('counselor'));
  assert.ok(!systemQueries[0].params.includes('forged@example.test'));
  assert.ok(!systemQueries[0].params.includes('forged'));
});

test('anonymous feedback stores no identity', async () => {
  assert.ok(feedbackModule);
  const systemQueries = [];
  const service = feedbackModule.createDemoFeedbackService({
    tenantPool: { async query() { throw new Error('identity lookup must not run'); } },
    systemPool: {
      async query(sql, params) {
        systemQueries.push({ sql, params });
        return [[{ report_id: '22222222-2222-4222-8222-222222222222', hit_count: 1, rate_limited: false }]];
      },
    },
    encrypt: (value) => value == null ? null : `enc(${value})`,
    decrypt: () => null,
  });

  await service.submit({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    route: '/auth',
    category: 'IMPROVEMENT',
    note: 'Explain the demo credentials',
    breadcrumbs: [],
    demoVersion: '7.1.0',
    sessionDurationSeconds: 12,
  }, null);

  const params = systemQueries[0].params;
  assert.equal(params[8], null);
  assert.equal(params[9], null);
});

test('database rate-limit rejection is surfaced distinctly', async () => {
  assert.ok(feedbackModule);
  const service = feedbackModule.createDemoFeedbackService({
    tenantPool: { async query() { return [[]]; } },
    systemPool: {
      async query() {
        return [[{ report_id: null, hit_count: 0, rate_limited: true }]];
      },
    },
    encrypt: (value) => value,
    decrypt: (value) => value,
  });

  await assert.rejects(
    service.submit({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      route: '/dashboard',
      category: 'BUG',
      breadcrumbs: [],
      demoVersion: '7.1.0',
      sessionDurationSeconds: 0,
    }, null),
    (error) => error?.code === 'DEMO_FEEDBACK_RATE_LIMITED',
  );
});

test('list filters include the full to-date and reject malformed dates', async () => {
  assert.ok(feedbackModule);
  const queries = [];
  const service = feedbackModule.createDemoFeedbackService({
    tenantPool: { async query() { return [[]]; } },
    systemPool: {
      async query(sql, params) {
        queries.push({ sql, params });
        return [[]];
      },
    },
    encrypt: (value) => value,
    decrypt: (value) => value,
  });

  await service.list({ from: '2026-06-10', to: '2026-06-11' });

  assert.match(queries[0].sql, /created_at >= \?/);
  assert.match(queries[0].sql, /created_at < \?/);
  assert.deepEqual(queries[0].params, [
    '2026-06-10T00:00:00.000Z',
    '2026-06-12T00:00:00.000Z',
  ]);
  await assert.rejects(service.list({ to: '2026-02-30' }), /to must be a date/i);
});

test('only constrained triage fields can be updated', async () => {
  assert.ok(feedbackModule);
  const queries = [];
  const service = feedbackModule.createDemoFeedbackService({
    tenantPool: { async query() { return [[]]; } },
    systemPool: {
      async query(sql, params) {
        queries.push({ sql, params });
        return [[{
          id: '33333333-3333-4333-8333-333333333333',
          processed: true,
          action: 'bug_fixed',
        }]];
      },
    },
    encrypt: (value) => value,
    decrypt: (value) => value,
  });

  const updated = await service.updateTriage(
    '33333333-3333-4333-8333-333333333333',
    { processed: true, action: 'bug_fixed' },
  );
  assert.equal(updated.processed, true);
  assert.equal(updated.action, 'bug_fixed');
  assert.match(queries[0].sql, /UPDATE public\.demo_feedback_reports/i);

  await assert.rejects(
    service.updateTriage('33333333-3333-4333-8333-333333333333', {
      processed: true,
      action: 'delete_everything',
    }),
    /action/i,
  );
});
