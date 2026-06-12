import test from 'node:test';
import assert from 'node:assert/strict';

let registry = null;
let importError = null;
try {
  registry = await import('../../../packages/domain/src/surfaces.js');
} catch (error) {
  importError = error;
}

test('shared surface registry exists and includes demo feedback surfaces', () => {
  assert.equal(importError, null);
  assert.ok(registry.isKnownSurfaceId('modal.demo_feedback'));
  assert.ok(registry.isKnownSurfaceId('control.demo_feedback'));
  assert.ok(registry.isKnownSurfaceId('control.demo_feedback.detail'));
});

test('surface summary is aggregate and contains no user context', () => {
  assert.ok(registry);
  const summary = registry.getSurfaceSummary();
  assert.ok(summary.total >= 3);
  assert.equal('userId' in summary, false);
  assert.equal('tenantId' in summary, false);
  assert.equal('sessionId' in summary, false);
});
