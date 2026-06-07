import http from 'node:http';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

let server;
let baseUrl;

before(async () => {
  process.env.FAITH_API_DISABLE_LISTEN = '1';
  delete process.env.DB_NAME;
  const moduleUrl = pathToFileURL(new URL('../src/index.js', import.meta.url).pathname);
  moduleUrl.searchParams.set('test', `localization-governance-routes-${Date.now()}`);
  const { handleApiRequest } = await import(moduleUrl.href);
  server = http.createServer(handleApiRequest);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  delete process.env.FAITH_API_DISABLE_LISTEN;
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function request(path, { method = 'GET', role = 'counselor', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': 'system',
      'x-staff-role': role,
      'x-actor-id': `actor-${role}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

test('legacy direct catalog mutations require an administrator', async () => {
  const result = await request('/v1/i18n/catalog/es-MX', {
    method: 'PATCH',
    body: { messages: { hello: 'Hola' } },
  });
  assert.equal(result.status, 403);
  assert.equal(result.body.error, 'Admin role required');
});

test('governed validation denies non-administrators before database access', async () => {
  const result = await request('/v1/i18n/governance/validate', {
    method: 'POST',
    body: { versionId: 'version-es' },
  });
  assert.equal(result.status, 403);
  assert.equal(result.body.code, 'authorization_denied');
  assert.equal(JSON.stringify(result.body).includes('version-es'), false);
});

test('governance status reports unavailable when no database is configured', async () => {
  const result = await request('/v1/i18n/governance/status?locale=es-MX', {
    role: 'practice_admin',
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'Database not configured');
});
