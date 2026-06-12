import { Readable } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';

let httpModule = null;
let importError = null;
try {
  httpModule = await import('../src/lib/demo-feedback-http.js');
} catch (error) {
  importError = error;
}

function request({ method = 'POST', body = null } = {}) {
  const stream = Readable.from(body === null ? [] : [JSON.stringify(body)]);
  stream.method = method;
  stream.headers = body === null ? {} : { 'content-type': 'application/json' };
  return stream;
}

function response() {
  let statusCode = null;
  let body = null;
  return {
    headersSent: false,
    setHeader() {},
    writeHead(code) {
      statusCode = code;
      this.headersSent = true;
    },
    end(value) {
      body = value ? JSON.parse(value) : null;
    },
    get statusCode() { return statusCode; },
    get body() { return body; },
  };
}

const validBody = {
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  route: '/dashboard',
  category: 'BUG',
  breadcrumbs: [],
  demoVersion: '7.1.0',
  sessionDurationSeconds: 5,
};

test('demo feedback HTTP module exists', () => {
  assert.equal(importError, null, 'apps/api/src/lib/demo-feedback-http.js must exist');
});

test('submission endpoint is disabled when server demo mode is off', async () => {
  assert.ok(httpModule);
  const handlers = httpModule.createDemoFeedbackHttpHandlers({
    service: { async submit() { throw new Error('must not submit'); } },
    demoEnabled: false,
  });
  const res = response();
  await handlers.submit(request({ body: validBody }), res, null);
  assert.equal(res.statusCode, 404);
});

test('accepted submission returns 202', async () => {
  assert.ok(httpModule);
  const handlers = httpModule.createDemoFeedbackHttpHandlers({
    service: {
      async submit(payload, session) {
        assert.equal(payload.userEmail, 'forged@example.test');
        assert.equal(session.role, 'counselor');
        return { id: 'report-1', hitCount: 2 };
      },
    },
    demoEnabled: true,
  });
  const res = response();
  await handlers.submit(request({
    body: { ...validBody, userEmail: 'forged@example.test' },
  }), res, { role: 'counselor' });
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, { id: 'report-1', hitCount: 2 });
});

test('rate-limit and database failures map to safe HTTP responses', async () => {
  assert.ok(httpModule);
  const limited = httpModule.createDemoFeedbackHttpHandlers({
    service: {
      async submit() {
        throw Object.assign(new Error('limited'), { code: 'DEMO_FEEDBACK_RATE_LIMITED' });
      },
    },
    demoEnabled: true,
  });
  const limitedRes = response();
  await limited.submit(request({ body: validBody }), limitedRes, null);
  assert.equal(limitedRes.statusCode, 429);

  const failed = httpModule.createDemoFeedbackHttpHandlers({
    service: { async submit() { throw new Error('password=secret SQL failed'); } },
    demoEnabled: true,
  });
  const failedRes = response();
  await failed.submit(request({ body: validBody }), failedRes, null);
  assert.equal(failedRes.statusCode, 500);
  assert.deepEqual(failedRes.body, { error: 'Unable to submit demo feedback' });
});

test('platform review handlers require platform_admin', async () => {
  assert.ok(httpModule);
  const handlers = httpModule.createDemoFeedbackHttpHandlers({
    service: {
      async list() { return []; },
      async updateTriage() { return {}; },
    },
    demoEnabled: true,
  });
  const listRes = response();
  await handlers.list(request({ method: 'GET' }), listRes, new URL('http://localhost/v1/platform/demo-feedback'), {
    role: 'practice_admin',
  });
  assert.equal(listRes.statusCode, 403);

  const updateRes = response();
  await handlers.update(request({
    method: 'PATCH',
    body: { processed: true, action: 'bug_fixed' },
  }), updateRes, '33333333-3333-4333-8333-333333333333', { role: 'counselor' });
  assert.equal(updateRes.statusCode, 403);
});
