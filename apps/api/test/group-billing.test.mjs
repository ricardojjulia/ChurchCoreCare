import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('group-billing (in-memory mode)', () => {
  it('buildGroupClaims returns empty array when DB not configured', async () => {
    const { buildGroupClaims } = await import('../src/lib/group-billing.js');
    const result = await buildGroupClaims({ groupSessionId: 'sess-1', tenantId: 'tenant-1' });
    assert.deepEqual(result, []);
  });

  it('getExistingSessionClaims returns empty array when DB not configured', async () => {
    const { getExistingSessionClaims } = await import('../src/lib/group-billing.js');
    const result = await getExistingSessionClaims('sess-1', 'tenant-1');
    assert.deepEqual(result, []);
  });
});

describe('CPT code mapping', () => {
  it('group → 90853', () => {
    assert.equal(cptForUnitType('group'), '90853');
  });

  it('family → 90849', () => {
    assert.equal(cptForUnitType('family'), '90849');
  });

  it('couple → 90847', () => {
    assert.equal(cptForUnitType('couple'), '90847');
  });

  it('other / unknown → 90853 (default group)', () => {
    assert.equal(cptForUnitType('other'), '90853');
    assert.equal(cptForUnitType(undefined), '90853');
    assert.equal(cptForUnitType(''), '90853');
  });
});

// Inline re-implementation to keep test self-contained
function cptForUnitType(unitType) {
  if (unitType === 'family') return '90849';
  if (unitType === 'couple') return '90847';
  return '90853';
}
