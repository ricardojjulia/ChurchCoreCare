import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GovernanceError,
  hashCatalog,
  normalizeLocale,
  validateCatalog,
} from '../src/index.js';

test('normalizeLocale returns canonical BCP 47 tags and rejects malformed input', () => {
  assert.equal(normalizeLocale('es-mx'), 'es-MX');
  assert.equal(normalizeLocale('pt-BR'), 'pt-BR');
  assert.throws(
    () => normalizeLocale('../es'),
    (error) => error instanceof GovernanceError && error.code === 'invalid_locale',
  );
});

test('hashCatalog is stable across key order', () => {
  assert.equal(hashCatalog({ b: 'two', a: 'one' }), hashCatalog({ a: 'one', b: 'two' }));
});

test('validation reports all required checks without catalog values', () => {
  const source = {
    'app.name': 'Acme',
    'items.count_one': '{count} item',
    'items.count_other': '{count} items',
    greeting: 'Hello {name}',
    blank: 'Required',
    therapy: 'Counseling',
    prohibited: 'Client',
  };
  const target = {
    __label: 'Español',
    'app.name': 'Acme',
    'items.count_one': '{count} elemento',
    greeting: 'Hola',
    blank: ' ',
    therapy: 'Terapia',
    prohibited: 'Paciente',
    extra: 'Extra',
  };

  const report = validateCatalog({
    source,
    target,
    sourceLocale: 'en-US',
    targetLocale: 'es-MX',
    glossary: {
      required: { Counseling: 'Consejería' },
      prohibited: { Client: 'Paciente' },
    },
    untranslatedAllowlist: ['app.name'],
  });

  assert.equal(report.passed, false);
  assert.equal(report.coverage <= 100, true);
  assert.deepEqual(
    report.checks.map((check) => check.code),
    [
      'blank_value',
      'extra_key',
      'glossary_prohibited_term_present',
      'glossary_required_term_missing',
      'missing_key',
      'placeholder_mismatch',
      'plural_form_missing',
    ],
  );
  assert.equal(JSON.stringify(report).includes('Hola'), false);
  assert.equal(JSON.stringify(report).includes('Required'), false);
});

test('validation caps coverage at 100 and ignores metadata and extras', () => {
  const report = validateCatalog({
    source: { one: 'One' },
    target: { __label: 'Spanish', one: 'Uno', extra: 'Extra' },
    sourceLocale: 'en-US',
    targetLocale: 'es-MX',
  });

  assert.equal(report.coverage, 100);
  assert.equal(report.passed, false);
  assert.deepEqual(report.checks.map((check) => check.code), ['extra_key']);
});

test('validation passes a complete catalog and permits allowlisted shared text', () => {
  const report = validateCatalog({
    source: { name: 'Acme', greeting: 'Hello {name}' },
    target: { name: 'Acme', greeting: 'Hola {name}' },
    sourceLocale: 'en-US',
    targetLocale: 'es-MX',
    untranslatedAllowlist: ['name'],
  });

  assert.equal(report.passed, true);
  assert.deepEqual(report.checks, []);
});
