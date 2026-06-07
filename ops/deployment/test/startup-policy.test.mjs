import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical startup no longer starts or depends on a local database container', async () => {
  const source = await readFile(new URL('../../start-all.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /docker compose up -d mysql/);
  assert.doesNotMatch(source, /Docker Desktop/);
  assert.match(source, /requireDatabaseEnv/);
});
