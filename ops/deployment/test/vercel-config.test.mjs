import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Vercel config builds the web app and routes API requests to the adapter', async () => {
  const config = JSON.parse(await readFile(new URL('../../../vercel.json', import.meta.url), 'utf8'));

  assert.equal(config.buildCommand, 'pnpm deploy:build');
  assert.equal(config.outputDirectory, 'apps/web/public');
  assert.equal(config.installCommand, 'pnpm install --frozen-lockfile');
  assert.equal(config.functions['api/index.js'].maxDuration, 60);
  assert.deepEqual(config.rewrites[0], {
    source: '/api/:path*',
    destination: '/api/index.js',
  });
  assert.deepEqual(config.rewrites.at(-1), {
    source: '/:path*',
    destination: '/index.html',
  });
});
