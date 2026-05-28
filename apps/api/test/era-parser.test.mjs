import test from 'node:test';
import assert from 'node:assert/strict';

import { parseEra } from '../src/lib/era-parser.js';

test('parseEra: returns empty array for null/missing input', () => {
  assert.deepEqual(parseEra(null), []);
  assert.deepEqual(parseEra(undefined), []);
  assert.deepEqual(parseEra({}), []);
});

test('parseEra: parses standard claims array', () => {
  const payload = {
    claims: [
      {
        payerClaimControlNumber: 'PCN-001',
        patientControlNumber: 'clm-abc',
        claimPaymentAmount: 125.00,
        claimChargeAmount: 150.00,
        claimAdjustmentGroups: [
          {
            groupCode: 'CO',
            adjustments: [{ reasonCode: '45', amount: 25.00 }],
          },
        ],
        serviceLines: [],
      },
    ],
  };

  const lines = parseEra(payload);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payerClaimNumber, 'PCN-001');
  assert.equal(lines[0].patientControlNumber, 'clm-abc');
  assert.equal(lines[0].paidAmount, 125);
  assert.equal(lines[0].adjustmentReason, 'CO-45');
  assert.equal(lines[0].eraStatus, 'partially_paid');
});

test('parseEra: fully paid when paidAmount >= billedAmount', () => {
  const payload = {
    claims: [
      {
        payerClaimControlNumber: 'PCN-002',
        claimPaymentAmount: 150.00,
        claimChargeAmount: 150.00,
        claimAdjustmentGroups: [],
      },
    ],
  };

  const lines = parseEra(payload);
  assert.equal(lines[0].eraStatus, 'paid');
  assert.equal(lines[0].adjustmentReason, null);
});

test('parseEra: denied when paidAmount is zero', () => {
  const payload = {
    claims: [
      {
        payerClaimControlNumber: 'PCN-003',
        claimPaymentAmount: 0,
        claimChargeAmount: 200.00,
        claimAdjustmentGroups: [
          {
            groupCode: 'CO',
            adjustments: [{ reasonCode: '97', amount: 200.00 }],
          },
        ],
      },
    ],
  };

  const lines = parseEra(payload);
  assert.equal(lines[0].eraStatus, 'denied');
  assert.equal(lines[0].adjustmentReason, 'CO-97');
});

test('parseEra: handles transactions wrapper format', () => {
  const payload = {
    transactions: [
      {
        claims: [
          {
            payerClaimControlNumber: 'PCN-TX-001',
            claimPaymentAmount: 80,
            claimChargeAmount: 80,
          },
        ],
      },
    ],
  };

  const lines = parseEra(payload);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payerClaimNumber, 'PCN-TX-001');
  assert.equal(lines[0].eraStatus, 'paid');
});

test('parseEra: handles alternate field names (claimPayments)', () => {
  const payload = {
    claimPayments: [
      {
        payerClaimNumber: 'ALT-001',
        paidAmount: 50,
        billedAmount: 100,
      },
    ],
  };

  const lines = parseEra(payload);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payerClaimNumber, 'ALT-001');
  assert.equal(lines[0].paidAmount, 50);
  assert.equal(lines[0].eraStatus, 'partially_paid');
});
