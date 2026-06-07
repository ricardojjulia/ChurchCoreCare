import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GovernanceError,
  createGovernanceService,
  hashCatalog,
} from '../src/index.js';

function createMemoryStorage() {
  const locales = new Map();
  const versions = new Map();
  const validations = new Map();
  const reviews = new Map();
  const activations = new Map();

  return {
    async transaction(callback) { return callback(this); },
    async getLocale(code) { return locales.get(code) ?? null; },
    async saveLocale(locale) { locales.set(locale.code, structuredClone(locale)); return locale; },
    async listLocales() { return [...locales.values()].map((value) => structuredClone(value)); },
    async getVersion(id) { return versions.get(id) ?? null; },
    async saveVersion(version) {
      if (versions.has(version.id)) throw new GovernanceError('version_conflict', 'Version exists');
      versions.set(version.id, structuredClone(version));
      return version;
    },
    async updateVersion(version) { versions.set(version.id, structuredClone(version)); return version; },
    async listVersions(localeId) {
      return [...versions.values()]
        .filter((version) => version.localeId === localeId)
        .map((value) => structuredClone(value));
    },
    async saveValidationReport(report) { validations.set(report.catalogVersionId, structuredClone(report)); return report; },
    async getCurrentValidation(versionId) { return validations.get(versionId) ?? null; },
    async saveReview(review) {
      const current = reviews.get(review.catalogVersionId) ?? [];
      reviews.set(review.catalogVersionId, [...current, structuredClone(review)]);
      return review;
    },
    async listReviews(versionId) { return structuredClone(reviews.get(versionId) ?? []); },
    async setActiveVersion(localeId, versionId, record) {
      const locale = [...locales.values()].find((item) => item.id === localeId);
      locale.activeVersionId = versionId;
      locales.set(locale.code, locale);
      const current = activations.get(localeId) ?? [];
      activations.set(localeId, [...current, structuredClone(record)]);
    },
    async listActivationHistory(localeId) { return structuredClone(activations.get(localeId) ?? []); },
  };
}

function actor(id = 'admin-1') {
  return { id, role: 'administrator' };
}

function createService(options = {}) {
  let sequence = 0;
  return createGovernanceService({
    storage: options.storage ?? createMemoryStorage(),
    providers: options.providers ?? {},
    policy: options.policy,
    clock: () => '2026-06-07T12:00:00.000Z',
    idGenerator: (prefix) => `${prefix}-${++sequence}`,
  });
}

test('enforces translation, validation, review, approval, and activation as separate steps', async () => {
  const service = createService({
    providers: {
      fake: {
        async translate({ messages }) {
          return {
            messages: Object.fromEntries(Object.entries(messages).map(([key, value]) => [key, `ES:${value}`])),
            provenance: { provider: 'fake' },
          };
        },
      },
    },
  });

  await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: actor() });
  const source = await service.createCatalogVersion({
    locale: 'en-US',
    messages: { hello: 'Hello {name}' },
    actor: actor(),
    source: true,
  });
  await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: actor() });
  const draft = await service.createCatalogVersion({
    locale: 'es-MX',
    messages: {},
    actor: actor(),
  });

  const translated = await service.translateVersion({
    versionId: draft.id,
    provider: 'fake',
    actor: actor(),
  });
  assert.equal(translated.state, 'translated');

  const validated = await service.validateVersion({ versionId: draft.id, actor: actor() });
  assert.equal(validated.version.state, 'validated');
  assert.equal(validated.report.sourceContentHash, hashCatalog(source.messages));

  const requested = await service.requestReview({ versionId: draft.id, actor: actor() });
  assert.equal(requested.state, 'in_linguistic_review');

  await service.submitReview({
    versionId: draft.id,
    reviewer: { id: 'linguist-1', role: 'linguistic' },
    decision: 'approved',
    comment: 'Reviewed',
  });
  assert.equal((await service.getVersion(draft.id)).state, 'in_linguistic_review');

  const approved = await service.approveVersion({ versionId: draft.id, actor: actor() });
  assert.equal(approved.state, 'approved');

  const active = await service.activateVersion({ versionId: draft.id, actor: actor() });
  assert.equal(active.state, 'active');
  assert.equal((await service.getLocaleStatus('es-MX')).activeVersionId, draft.id);
});

test('requires distinct reviewers when multiple roles are configured', async () => {
  const service = createService({
    policy: { requiredReviews: ['linguistic', 'domain'], separationOfDuties: true },
  });
  await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: actor() });
  await service.createCatalogVersion({ locale: 'en-US', messages: { hello: 'Hello' }, actor: actor(), source: true });
  await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: actor() });
  const version = await service.createCatalogVersion({ locale: 'es-MX', messages: { hello: 'Hola' }, actor: actor() });
  await service.validateVersion({ versionId: version.id, actor: actor() });
  await service.requestReview({ versionId: version.id, actor: actor() });
  await service.submitReview({
    versionId: version.id,
    reviewer: { id: 'reviewer-1', role: 'linguistic' },
    decision: 'approved',
  });

  await assert.rejects(
    service.submitReview({
      versionId: version.id,
      reviewer: { id: 'reviewer-1', role: 'domain' },
      decision: 'approved',
    }),
    (error) => error.code === 'separation_of_duties_violation',
  );
});

test('marks active target versions stale when the source changes and CI fails', async () => {
  const service = createService();
  await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: actor() });
  await service.createCatalogVersion({ locale: 'en-US', messages: { hello: 'Hello' }, actor: actor(), source: true });
  await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: actor() });
  const version = await service.createCatalogVersion({ locale: 'es-MX', messages: { hello: 'Hola' }, actor: actor() });
  await service.validateVersion({ versionId: version.id, actor: actor() });
  await service.requestReview({ versionId: version.id, actor: actor() });
  await service.submitReview({
    versionId: version.id,
    reviewer: { id: 'linguist-1', role: 'linguistic' },
    decision: 'approved',
  });
  await service.approveVersion({ versionId: version.id, actor: actor() });
  await service.activateVersion({ versionId: version.id, actor: actor() });

  await service.createCatalogVersion({
    locale: 'en-US',
    messages: { hello: 'Hello', goodbye: 'Goodbye' },
    actor: actor(),
    source: true,
  });

  assert.equal((await service.getVersion(version.id)).state, 'stale');
  const result = await service.evaluateCiPolicy({ requiredLocales: ['es-MX'] });
  assert.equal(result.passed, false);
  assert.deepEqual(result.failures.map((failure) => failure.code), ['stale_catalog']);
});

test('changes requested invalidates prior validation and bounded comments are enforced', async () => {
  const service = createService({
    policy: { maxReviewCommentLength: 5 },
    providers: {
      fake: {
        async translate({ messages }) {
          return { messages, provenance: { provider: 'fake' } };
        },
      },
    },
  });
  await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: actor() });
  await service.createCatalogVersion({ locale: 'en-US', messages: { hello: 'Hello' }, actor: actor(), source: true });
  await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: actor() });
  const version = await service.createCatalogVersion({ locale: 'es-MX', messages: { hello: 'Hola' }, actor: actor() });
  await service.validateVersion({ versionId: version.id, actor: actor() });
  await service.requestReview({ versionId: version.id, actor: actor() });

  await assert.rejects(
    service.submitReview({
      versionId: version.id,
      reviewer: { id: 'linguist-1', role: 'linguistic' },
      decision: 'changes_requested',
      comment: 'too long',
    }),
    (error) => error.code === 'invalid_review_comment',
  );

  await service.submitReview({
    versionId: version.id,
    reviewer: { id: 'linguist-1', role: 'linguistic' },
    decision: 'changes_requested',
    comment: 'redo',
  });
  assert.equal((await service.getVersion(version.id)).state, 'draft');
  await assert.rejects(
    service.translateVersion({
      versionId: version.id,
      provider: 'fake',
      actor: actor(),
    }),
    (error) => error.code === 'version_locked',
  );
});

test('rolls back to a previously activated immutable version', async () => {
  const storage = createMemoryStorage();
  const service = createService({ storage });
  await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: actor() });
  await service.createCatalogVersion({ locale: 'en-US', messages: { hello: 'Hello' }, actor: actor(), source: true });
  await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: actor() });

  async function activate(messages, reviewerId) {
    const version = await service.createCatalogVersion({ locale: 'es-MX', messages, actor: actor() });
    await service.validateVersion({ versionId: version.id, actor: actor() });
    await service.requestReview({ versionId: version.id, actor: actor() });
    await service.submitReview({
      versionId: version.id,
      reviewer: { id: reviewerId, role: 'linguistic' },
      decision: 'approved',
    });
    await service.approveVersion({ versionId: version.id, actor: actor() });
    await service.activateVersion({ versionId: version.id, actor: actor() });
    return version;
  }

  const first = await activate({ hello: 'Hola' }, 'linguist-1');
  const second = await activate({ hello: 'Buenas' }, 'linguist-2');
  const rolledBack = await service.rollbackLocale({ locale: 'es-MX', toVersionId: first.id, actor: actor() });

  assert.equal(rolledBack.id, first.id);
  assert.equal((await service.getLocaleStatus('es-MX')).activeVersionId, first.id);
  assert.equal((await storage.listActivationHistory((await storage.getLocale('es-MX')).id)).length, 3);
  assert.equal((await service.getVersion(second.id)).messages.hello, 'Buenas');
});

test('CI verifies active state, current source, validation, and approval evidence', async () => {
  const storage = createMemoryStorage();
  const service = createService({ storage });
  await storage.saveLocale({
    id: 'locale-es',
    code: 'es-MX',
    sourceLocale: 'en-US',
    activeVersionId: 'version-es',
  });
  await storage.saveVersion({
    id: 'version-es',
    localeId: 'locale-es',
    state: 'legacy_unverified',
    contentHash: 'target-hash',
    sourceContentHash: 'old-source',
    messages: { hello: 'Hola' },
  });

  const result = await service.evaluateCiPolicy({ requiredLocales: ['es-MX'] });
  assert.equal(result.passed, false);
  assert.deepEqual(result.failures.map((failure) => failure.code), ['unapproved_active_version']);
});
