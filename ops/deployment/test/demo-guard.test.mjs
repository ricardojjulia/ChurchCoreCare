import test from 'node:test';
import assert from 'node:assert/strict';

import { assertDemoEnvironment } from '../demo-guard.mjs';

test('demo seed guard rejects environments that are not explicitly demo', () => {
  assert.throws(
    () => assertDemoEnvironment({ DEMO_ENVIRONMENT: 'false' }),
    /DEMO_ENVIRONMENT=true/,
  );
});

test('demo seed guard accepts explicit demo environments', () => {
  assert.equal(assertDemoEnvironment({ DEMO_ENVIRONMENT: 'true' }), true);
});
