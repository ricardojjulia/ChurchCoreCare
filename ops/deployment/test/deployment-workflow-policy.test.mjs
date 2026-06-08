import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the legacy GCP deployment is manual while Vercel owns automatic main deploys', async () => {
  const workflow = await readFile(
    new URL('../../../.github/workflows/deploy.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /^name: Legacy GCP Deploy \(Manual\)$/m);
  assert.match(workflow, /^  workflow_dispatch:$/m);
  assert.doesNotMatch(workflow, /^  push:$/m);
  assert.match(workflow, /if: github\.event\.inputs\.environment == 'production'/);
  assert.doesNotMatch(workflow, /github\.event_name == 'push'/);
});
