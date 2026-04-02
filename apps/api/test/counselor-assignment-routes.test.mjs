import http from 'node:http';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  const { handleApiRequest } = await import('../src/index.js');
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
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

async function requestJson(path, {
  method = 'GET',
  role = 'counselor',
  staffId = 's-001',
  tenantId = 'system',
  body,
} = {}) {
  const headers = {
    'x-tenant-id': tenantId,
    'x-staff-role': role,
    'x-staff-id': staffId,
  };

  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

test('assigned counselor can read an assigned client detail route', async () => {
  const response = await requestJson('/v1/clients/c-001', {
    role: 'counselor',
    staffId: 's-001',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body?.item?.id, 'c-001');
});

test('assigned counselor is denied from reading another counselor client detail route', async () => {
  const response = await requestJson('/v1/clients/c-003', {
    role: 'counselor',
    staffId: 's-001',
  });

  assert.equal(response.status, 403);
  assert.equal(response.body?.error, 'Access to this resource is not permitted');
});

test('filtered counselor form assignment read denies unassigned client access', async () => {
  const response = await requestJson('/v1/forms/assignments?clientId=c-003', {
    role: 'counselor',
    staffId: 's-001',
  });

  assert.equal(response.status, 403);
  assert.equal(response.body?.error, 'Access to this resource is not permitted');
});

test('broad counselor form assignment collection auto-scopes to assigned clients', async () => {
  const response = await requestJson('/v1/forms/assignments', {
    role: 'counselor',
    staffId: 's-002',
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body?.items ?? [], []);
});

test('broad counselor waitlist collection auto-scopes to assigned clients', async () => {
  const response = await requestJson('/v1/waitlist', {
    role: 'counselor',
    staffId: 's-002',
  });

  assert.equal(response.status, 200);
  assert.deepEqual(
    (response.body?.items ?? []).map((item) => item.clientId),
    ['c-003'],
  );
});

test('broad counselor faith referral collection auto-scopes to assigned clients', async () => {
  const deniedScope = await requestJson('/v1/faith/referral-coordination', {
    role: 'counselor',
    staffId: 's-002',
  });
  assert.equal(deniedScope.status, 200);
  assert.deepEqual(deniedScope.body?.items ?? [], []);

  const allowedScope = await requestJson('/v1/faith/referral-coordination', {
    role: 'counselor',
    staffId: 's-001',
  });
  assert.equal(allowedScope.status, 200);
  assert.deepEqual(
    (allowedScope.body?.items ?? []).map((item) => item.clientId),
    ['c-001'],
  );
});
