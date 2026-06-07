import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

process.env.FAITH_API_DISABLE_LISTEN = '1';

class ResponseRecorder extends EventEmitter {
  headers = {};
  statusCode = 200;
  body = '';

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[String(name).toLowerCase()];
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    for (const [name, value] of Object.entries(headers)) this.setHeader(name, value);
  }

  end(chunk = '') {
    this.body += chunk;
    this.headersSent = true;
    this.emit('finish');
  }
}

test('Vercel adapter strips the public API prefix and preserves query strings', async () => {
  process.env.DEMO_ENVIRONMENT = 'true';
  const { default: handler } = await import('../../../api/index.js');
  const request = new EventEmitter();
  request.url = '/api/health?source=vercel';
  request.method = 'GET';
  request.headers = { host: 'churchcore-care.vercel.app' };
  const response = new ResponseRecorder();

  await handler(request, response);

  assert.equal(request.url, '/health?source=vercel');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    {
      status: JSON.parse(response.body).status,
      demoEnvironment: JSON.parse(response.body).demoEnvironment,
    },
    {
      status: 'ok',
      demoEnvironment: true,
    },
  );
});

test('Vercel adapter uses the default tenant when host routing is disabled', async () => {
  delete process.env.ENABLE_TENANT_HOST_ROUTING;
  const { resolveTenantContext } = await import('../src/middleware/tenant.js');

  assert.deepEqual(resolveTenantContext('churchcore-care.vercel.app'), {
    host: 'churchcore-care.vercel.app',
    tenantId: 'system',
    strictMode: false,
    source: 'default',
    isExplicitTenantHost: false,
  });
});
