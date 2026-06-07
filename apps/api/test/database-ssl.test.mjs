import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDatabaseSslConfig } from '../src/db/ssl.js';

test('database TLS is disabled unless explicitly enabled', () => {
  assert.equal(buildDatabaseSslConfig({}), false);
});

test('database TLS verifies certificates by default', () => {
  assert.deepEqual(buildDatabaseSslConfig({ DB_SSL: 'true' }), { rejectUnauthorized: true });
});

test('database TLS verification can be explicitly disabled for a managed pooler', () => {
  assert.deepEqual(
    buildDatabaseSslConfig({
      DB_SSL: 'true',
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    }),
    { rejectUnauthorized: false },
  );
});
