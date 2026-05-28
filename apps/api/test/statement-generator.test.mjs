import test from 'node:test';
import assert from 'node:assert/strict';

import { generateStatement } from '../src/lib/statement-generator.js';

const BASE = {
  practice: { name: 'Hope Counseling', addressLine1: '100 Main St', city: 'Austin', state: 'TX', postalCode: '78701', phone: '512-555-0100' },
  client: { firstName: 'Jane', lastName: 'Doe' },
  claims: [],
  invoices: [],
  generatedAt: '2026-05-28T12:00:00.000Z',
};

test('generateStatement: returns valid HTML document', () => {
  const html = generateStatement(BASE);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<html'));
  assert.ok(html.includes('</html>'));
});

test('generateStatement: includes client name', () => {
  const html = generateStatement(BASE);
  assert.ok(html.includes('Jane Doe'));
});

test('generateStatement: includes practice name', () => {
  const html = generateStatement(BASE);
  assert.ok(html.includes('Hope Counseling'));
});

test('generateStatement: escapes HTML special characters', () => {
  const html = generateStatement({
    ...BASE,
    practice: { ...BASE.practice, name: 'A & B <Practice>' },
  });
  assert.ok(html.includes('A &amp; B &lt;Practice&gt;'));
  assert.ok(!html.includes('A & B <Practice>'));
});

test('generateStatement: shows "No claims on file" when claims empty', () => {
  const html = generateStatement({ ...BASE, claims: [] });
  assert.ok(html.includes('No claims on file.'));
});

test('generateStatement: renders claim rows when claims provided', () => {
  const html = generateStatement({
    ...BASE,
    claims: [
      {
        id: 'clm-abc-1234',
        status: 'paid',
        paidAmount: 125.00,
        adjustmentReason: 'CO-45',
        serviceDate: '2026-05-01',
      },
    ],
  });
  assert.ok(html.includes('CO-45'));
  assert.ok(html.includes('$125.00'));
});

test('generateStatement: renders total balance from invoices', () => {
  const html = generateStatement({
    ...BASE,
    invoices: [
      { amount: 300, balance: 100, status: 'pending', dueAt: '2026-06-01' },
      { amount: 150, balance: 50, status: 'pending', dueAt: '2026-06-15' },
    ],
  });
  assert.ok(html.includes('$150.00')); // total outstanding 100+50
});

test('generateStatement: handles missing client gracefully', () => {
  const html = generateStatement({ ...BASE, client: null });
  assert.ok(html.includes('Patient'));
});

test('generateStatement: handles missing practice gracefully', () => {
  const html = generateStatement({ ...BASE, practice: null });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
});
