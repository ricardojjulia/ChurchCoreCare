import assert from 'node:assert/strict';
import test from 'node:test';

import { databaseConfigFromEnv, requireDatabaseEnv } from '../src/db/config.js';

const validEnv = {
  DB_HOST: 'aws-1-us-east-1.pooler.supabase.com',
  DB_PORT: '5432',
  DB_NAME: 'postgres',
  DB_USER: 'postgres.projectref',
  DB_PASSWORD: 'secret',
  DB_SSL: 'true',
};

test('database config requires explicit SaaS connection values', () => {
  assert.throws(() => requireDatabaseEnv({}), /DB_HOST/);
});

test('database config rejects local hosts outside test fixtures', () => {
  assert.throws(
    () => requireDatabaseEnv({ ...validEnv, DB_HOST: '127.0.0.1' }),
    /Local database hosts are not allowed/,
  );
});

test('database config allows local hosts only for explicit test fixtures', () => {
  assert.doesNotThrow(() => requireDatabaseEnv({
    ...validEnv,
    DB_HOST: '127.0.0.1',
    CHURCHCORE_ALLOW_TEST_DATABASE: 'true',
  }));
});

test('database config requires encrypted database transport', () => {
  assert.throws(() => requireDatabaseEnv({ ...validEnv, DB_SSL: 'false' }), /DB_SSL=true/);
});

test('database config returns the configured online Supabase values without defaults', () => {
  assert.deepEqual(databaseConfigFromEnv(validEnv), {
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.projectref',
    password: 'secret',
    ssl: 'true',
    sslRejectUnauthorized: undefined,
  });
});
