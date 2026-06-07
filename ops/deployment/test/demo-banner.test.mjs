import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the web app renders a visible synthetic-data banner when the demo flag is enabled', async () => {
  const component = await readFile(
    new URL('../../../apps/web/src/components/DemoEnvironmentBanner.jsx', import.meta.url),
    'utf8',
  );
  const app = await readFile(new URL('../../../apps/web/src/index.jsx', import.meta.url), 'utf8');

  assert.match(component, /VITE_DEMO_ENVIRONMENT/);
  assert.match(component, /Synthetic demonstration data only/);
  assert.match(app, /DemoEnvironmentBanner/);
});
