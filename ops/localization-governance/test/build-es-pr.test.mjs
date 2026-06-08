import assert from 'node:assert/strict';
import test from 'node:test';

import { baseMessages } from '../../../packages/i18n/src/index.js';
import esMxCatalog from '../../../apps/api/data/i18n/es-MX.json' with { type: 'json' };
import {
  buildEsPrCatalog,
  extractPlaceholders,
  listUntranslatedKeys,
  publishEsPrCatalog,
  summarizePublication,
} from '../build-es-pr.mjs';

test('buildEsPrCatalog emits exactly the canonical source keys with es-PR metadata', () => {
  const catalog = buildEsPrCatalog({
    sourceMessages: baseMessages,
    spanishSeed: esMxCatalog,
  });

  assert.equal(catalog.__label, 'Español (Puerto Rico)');
  assert.equal(catalog.__meta.locale, 'es-PR');
  assert.equal(catalog.__meta.sourceLocale, 'en-US');
  assert.equal(catalog.__meta.seedLocale, 'es-MX');
  assert.deepEqual(
    Object.keys(catalog).filter((key) => !key.startsWith('__')).sort(),
    Object.keys(baseMessages).sort(),
  );
});

test('buildEsPrCatalog preserves every source placeholder', () => {
  const catalog = buildEsPrCatalog({
    sourceMessages: baseMessages,
    spanishSeed: esMxCatalog,
  });

  for (const [key, sourceValue] of Object.entries(baseMessages)) {
    assert.deepEqual(
      extractPlaceholders(catalog[key]),
      extractPlaceholders(sourceValue),
      `placeholder mismatch for ${key}`,
    );
  }
});

test('buildEsPrCatalog requires a Spanish value for every canonical key', () => {
  assert.throws(
    () => buildEsPrCatalog({
      sourceMessages: { greeting: 'Hello', farewell: 'Goodbye' },
      spanishSeed: { greeting: 'Hola' },
    }),
    /Missing Spanish seed values: farewell/,
  );
});

test('the committed es-PR catalog has no unapproved English carryovers', async () => {
  const esPrCatalog = (await import(
    '../../../apps/api/data/i18n/es-PR.json',
    { with: { type: 'json' } }
  )).default;

  assert.deepEqual(
    listUntranslatedKeys({
      sourceMessages: baseMessages,
      targetMessages: esPrCatalog,
    }),
    [],
  );
});

test('publishEsPrCatalog validates and requests review without approving or activating', async () => {
  const calls = [];
  const storage = {
    async getLocale() { return null; },
    async listVersions() { return []; },
  };
  const service = {
    async createLocale(input) {
      calls.push(['createLocale', input]);
      return { id: 'locale-es-pr', code: 'es-PR' };
    },
    async createCatalogVersion(input) {
      calls.push(['createCatalogVersion', input]);
      return { id: 'version-es-pr', state: 'draft', contentHash: 'hash-es-pr' };
    },
    async validateVersion(input) {
      calls.push(['validateVersion', input]);
      return {
        version: { id: 'version-es-pr', state: 'validated' },
        report: { passed: true, coverage: 100 },
      };
    },
    async requestReview(input) {
      calls.push(['requestReview', input]);
      return { id: 'version-es-pr', state: 'in_linguistic_review' };
    },
  };

  const result = await publishEsPrCatalog({
    storage,
    service,
    messages: { greeting: 'Hola' },
    actor: { id: 'translation-operator', role: 'practice_admin' },
    audit: async (event) => calls.push(['audit', event]),
  });

  assert.equal(result.version.state, 'in_linguistic_review');
  assert.equal(result.validation.passed, true);
  assert.deepEqual(calls.map(([name]) => name), [
    'createLocale',
    'createCatalogVersion',
    'validateVersion',
    'requestReview',
    'audit',
  ]);
  assert.equal(calls.at(-1)[1].action, 'localization.catalog.review_ready');
  assert.equal(calls.at(-1)[1].result, 'success');
  assert.equal(calls.some(([name]) => name === 'approveVersion'), false);
  assert.equal(calls.some(([name]) => name === 'activateVersion'), false);
});

test('publishEsPrCatalog reuses an identical existing review version', async () => {
  const calls = [];
  const existing = {
    id: 'version-existing',
    state: 'in_linguistic_review',
    contentHash: 'same-hash',
  };
  const storage = {
    async getLocale() { return { id: 'locale-es-pr', code: 'es-PR' }; },
    async listVersions() { return [existing]; },
  };
  const service = {
    async createCatalogVersion() {
      calls.push('createCatalogVersion');
      return { id: 'unexpected' };
    },
  };

  const result = await publishEsPrCatalog({
    storage,
    service,
    messages: { greeting: 'Hola' },
    contentHash: 'same-hash',
    actor: { id: 'translation-operator', role: 'practice_admin' },
    audit: async (event) => calls.push(event.action),
  });

  assert.equal(result.version.id, 'version-existing');
  assert.equal(result.reused, true);
  assert.deepEqual(calls, ['localization.catalog.review_ready']);
});

test('publishEsPrCatalog resumes an identical validated version into review', async () => {
  const calls = [];
  const existing = {
    id: 'version-validated',
    state: 'validated',
    contentHash: 'same-hash',
  };
  const storage = {
    async getLocale() { return { id: 'locale-es-pr', code: 'es-PR' }; },
    async listVersions() { return [existing]; },
  };
  const service = {
    async requestReview(input) {
      calls.push(['requestReview', input]);
      return { ...existing, state: 'in_linguistic_review' };
    },
  };

  const result = await publishEsPrCatalog({
    storage,
    service,
    messages: { greeting: 'Hola' },
    contentHash: 'same-hash',
    actor: { id: 'translation-operator', role: 'practice_admin' },
    audit: async (event) => calls.push(['audit', event]),
  });

  assert.equal(result.version.state, 'in_linguistic_review');
  assert.deepEqual(calls.map(([name]) => name), ['requestReview', 'audit']);
});

test('summarizePublication reports reused review-ready versions without a new report', () => {
  assert.deepEqual(
    summarizePublication({
      tenantId: 'system',
      result: {
        version: { id: 'version-existing', state: 'in_linguistic_review' },
        validation: null,
        reused: true,
      },
    }),
    {
      tenantId: 'system',
      versionId: 'version-existing',
      state: 'in_linguistic_review',
      validationPassed: true,
      coverage: 100,
      reused: true,
    },
  );
});
