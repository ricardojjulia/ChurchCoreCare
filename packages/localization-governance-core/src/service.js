import { GovernanceError } from './errors.js';
import { hashCatalog } from './hash.js';
import { normalizeLocale } from './locale.js';
import { normalizePolicy } from './policy.js';
import { validateCatalog } from './validator.js';

function requireActor(actor) {
  if (!actor?.id) throw new GovernanceError('actor_required', 'Actor identity is required.');
}

function requireState(version, allowed, operation) {
  if (!allowed.includes(version.state)) {
    throw new GovernanceError(
      'invalid_transition',
      `Cannot ${operation} version in state ${version.state}.`,
      { state: version.state, operation },
    );
  }
}

export function createGovernanceService(options) {
  if (!options?.storage) throw new GovernanceError('storage_required', 'Storage adapter is required.');
  const storage = options.storage;
  const providers = options.providers ?? {};
  const policy = normalizePolicy(options.policy);
  const clock = options.clock ?? (() => new Date().toISOString());
  const idGenerator = options.idGenerator ?? ((prefix) => `${prefix}-${crypto.randomUUID()}`);

  async function getVersionOrThrow(id) {
    const version = await storage.getVersion(id);
    if (!version) throw new GovernanceError('version_not_found', `Version not found: ${id}`);
    return version;
  }

  async function getLocaleOrThrow(code) {
    const locale = await storage.getLocale(normalizeLocale(code));
    if (!locale) throw new GovernanceError('locale_not_found', `Locale not found: ${code}`);
    return locale;
  }

  async function currentSourceVersion(locale) {
    const sourceLocale = await getLocaleOrThrow(locale.sourceLocale);
    const versions = await storage.listVersions(sourceLocale.id);
    const source = versions.at(-1);
    if (!source) throw new GovernanceError('source_version_not_found', 'Source catalog version not found.');
    return source;
  }

  async function updateVersion(version) {
    if (!storage.updateVersion) {
      throw new GovernanceError('storage_failure', 'Storage adapter does not support version state updates.');
    }
    return storage.updateVersion(version);
  }

  async function markTargetsStale(sourceLocaleCode, newSourceHash) {
    const locales = await storage.listLocales();
    for (const locale of locales.filter((item) => item.sourceLocale === sourceLocaleCode && item.code !== sourceLocaleCode)) {
      const versions = await storage.listVersions(locale.id);
      for (const version of versions) {
        if (
          ['approved', 'active'].includes(version.state)
          && version.sourceContentHash !== newSourceHash
        ) {
          await updateVersion({ ...version, state: 'stale', updatedAt: clock() });
        }
      }
    }
  }

  return {
    policy,

    async createLocale({ code, sourceLocale, actor, policyId = 'default' }) {
      requireActor(actor);
      const canonical = normalizeLocale(code);
      const source = normalizeLocale(sourceLocale);
      const existing = await storage.getLocale(canonical);
      if (existing) return existing;
      const now = clock();
      const locale = {
        id: idGenerator('locale'),
        code: canonical,
        sourceLocale: source,
        policyId,
        activeVersionId: null,
        createdAt: now,
        updatedAt: now,
      };
      await storage.saveLocale(locale);
      return locale;
    },

    async createCatalogVersion({ locale: localeCode, messages, actor, source = false, provenance = {} }) {
      requireActor(actor);
      const locale = await getLocaleOrThrow(localeCode);
      const versions = await storage.listVersions(locale.id);
      const sourceVersion = source ? null : await currentSourceVersion(locale);
      const now = clock();
      const version = {
        id: idGenerator('version'),
        localeId: locale.id,
        locale: locale.code,
        version: versions.length + 1,
        sourceCatalogVersion: sourceVersion?.version ?? versions.length + 1,
        sourceContentHash: sourceVersion?.contentHash ?? hashCatalog(messages),
        contentHash: hashCatalog(messages),
        state: source ? 'active' : 'draft',
        messages: structuredClone(messages),
        provenance: structuredClone(provenance),
        createdBy: actor.id,
        createdAt: now,
        updatedAt: now,
      };
      await storage.saveVersion(version);
      if (source) {
        await storage.setActiveVersion(locale.id, version.id, {
          id: idGenerator('activation'),
          localeId: locale.id,
          catalogVersionId: version.id,
          previousCatalogVersionId: locale.activeVersionId,
          action: 'activate',
          actorId: actor.id,
          createdAt: now,
        });
        await markTargetsStale(locale.code, version.contentHash);
      }
      return version;
    },

    async translateVersion({ versionId, provider: providerName, actor, scope = 'full', glossary = {} }) {
      requireActor(actor);
      const version = await getVersionOrThrow(versionId);
      requireState(version, ['draft', 'translated'], 'translate');
      if ((await storage.listReviews(version.id)).length > 0) {
        throw new GovernanceError('version_locked', 'Reviewed catalog versions are immutable.');
      }
      const locale = (await storage.listLocales()).find((item) => item.id === version.localeId);
      const source = await currentSourceVersion(locale);
      const provider = providers[providerName];
      if (!provider) throw new GovernanceError('provider_failure', `Unknown provider: ${providerName}`);
      const keys = scope === 'missing'
        ? Object.keys(source.messages).filter((key) => !(key in version.messages))
        : Object.keys(source.messages);
      const messages = Object.fromEntries(keys.map((key) => [key, source.messages[key]]));
      const result = await provider.translate({
        sourceLocale: locale.sourceLocale,
        targetLocale: locale.code,
        messages,
        glossary,
      });
      const next = {
        ...version,
        messages: { ...version.messages, ...result.messages },
        contentHash: hashCatalog({ ...version.messages, ...result.messages }),
        provenance: { ...version.provenance, ...result.provenance },
        state: 'translated',
        updatedAt: clock(),
      };
      await updateVersion(next);
      return next;
    },

    async validateVersion({ versionId, actor, glossary = {}, untranslatedAllowlist = [] }) {
      requireActor(actor);
      const version = await getVersionOrThrow(versionId);
      requireState(version, ['draft', 'translated', 'validated'], 'validate');
      if ((await storage.listReviews(version.id)).length > 0) {
        throw new GovernanceError('version_locked', 'Reviewed catalog versions are immutable.');
      }
      const locale = (await storage.listLocales()).find((item) => item.id === version.localeId);
      const source = await currentSourceVersion(locale);
      const reportData = validateCatalog({
        source: source.messages,
        target: version.messages,
        sourceLocale: locale.sourceLocale,
        targetLocale: locale.code,
        glossary,
        untranslatedAllowlist,
      });
      const report = {
        id: idGenerator('validation'),
        catalogVersionId: version.id,
        validatorVersion: '0.1.0',
        ...reportData,
        createdAt: clock(),
      };
      await storage.saveValidationReport(report);
      const next = {
        ...version,
        sourceCatalogVersion: source.version,
        sourceContentHash: source.contentHash,
        contentHash: report.contentHash,
        state: report.passed ? 'validated' : (version.provenance?.provider ? 'translated' : 'draft'),
        updatedAt: clock(),
      };
      await updateVersion(next);
      if (!report.passed) {
        throw new GovernanceError('validation_failed', 'Catalog validation failed.', {
          reportId: report.id,
          checks: report.checks,
        });
      }
      return { version: next, report };
    },

    async requestReview({ versionId, actor }) {
      requireActor(actor);
      const version = await getVersionOrThrow(versionId);
      requireState(version, ['validated'], 'request review');
      const next = { ...version, state: 'in_linguistic_review', updatedAt: clock() };
      await updateVersion(next);
      return next;
    },

    async submitReview({ versionId, reviewer, decision, comment = '' }) {
      requireActor(reviewer);
      const version = await getVersionOrThrow(versionId);
      requireState(version, ['in_linguistic_review', 'in_domain_review'], 'submit review');
      if (!policy.requiredReviews.includes(reviewer.role)) {
        throw new GovernanceError('review_role_not_required', `Review role is not required: ${reviewer.role}`);
      }
      if (!['approved', 'changes_requested'].includes(decision)) {
        throw new GovernanceError('invalid_review_decision', `Invalid review decision: ${decision}`);
      }
      if (comment.length > policy.maxReviewCommentLength) {
        throw new GovernanceError('invalid_review_comment', 'Review comment exceeds configured maximum.');
      }
      const existing = await storage.listReviews(version.id);
      if (
        policy.separationOfDuties
        && existing.some((review) => review.reviewerId === reviewer.id && review.reviewerRole !== reviewer.role)
      ) {
        throw new GovernanceError('separation_of_duties_violation', 'Reviewer cannot satisfy multiple roles.');
      }
      const review = {
        id: idGenerator('review'),
        catalogVersionId: version.id,
        contentHash: version.contentHash,
        reviewerId: reviewer.id,
        reviewerRole: reviewer.role,
        decision,
        comment,
        createdAt: clock(),
      };
      await storage.saveReview(review);
      let state = version.state;
      if (decision === 'changes_requested') state = 'draft';
      else if (
        reviewer.role === 'linguistic'
        && policy.requiredReviews.some((role) => role !== 'linguistic')
      ) state = 'in_domain_review';
      const next = { ...version, state, updatedAt: clock() };
      await updateVersion(next);
      return review;
    },

    async approveVersion({ versionId, actor }) {
      requireActor(actor);
      const version = await getVersionOrThrow(versionId);
      requireState(version, ['in_linguistic_review', 'in_domain_review'], 'approve');
      const validation = await storage.getCurrentValidation(version.id);
      if (!validation?.passed || validation.contentHash !== version.contentHash) {
        throw new GovernanceError('validation_failed', 'Fresh passing validation is required.');
      }
      const reviews = await storage.listReviews(version.id);
      const approvedRoles = new Set(
        reviews
          .filter((review) => review.decision === 'approved' && review.contentHash === version.contentHash)
          .map((review) => review.reviewerRole),
      );
      const missing = policy.requiredReviews.filter((role) => !approvedRoles.has(role));
      if (missing.length) {
        throw new GovernanceError('approval_incomplete', 'Required reviews are incomplete.', { missing });
      }
      const next = { ...version, state: 'approved', approvedBy: actor.id, updatedAt: clock() };
      await updateVersion(next);
      return next;
    },

    async activateVersion({ versionId, actor }) {
      requireActor(actor);
      return storage.transaction(async () => {
        const version = await getVersionOrThrow(versionId);
        requireState(version, ['approved'], 'activate');
        const locale = (await storage.listLocales()).find((item) => item.id === version.localeId);
        const source = await currentSourceVersion(locale);
        const validation = await storage.getCurrentValidation(version.id);
        if (
          version.sourceContentHash !== source.contentHash
          || !validation?.passed
          || validation.contentHash !== version.contentHash
        ) {
          throw new GovernanceError('stale_catalog', 'Catalog is not current with the source.');
        }
        const next = { ...version, state: 'active', activatedAt: clock(), updatedAt: clock() };
        await updateVersion(next);
        await storage.setActiveVersion(locale.id, version.id, {
          id: idGenerator('activation'),
          localeId: locale.id,
          catalogVersionId: version.id,
          previousCatalogVersionId: locale.activeVersionId,
          action: 'activate',
          actorId: actor.id,
          createdAt: clock(),
        });
        return next;
      });
    },

    async rollbackLocale({ locale: localeCode, toVersionId, actor }) {
      requireActor(actor);
      return storage.transaction(async () => {
        const locale = await getLocaleOrThrow(localeCode);
        const version = await getVersionOrThrow(toVersionId);
        if (version.localeId !== locale.id) {
          throw new GovernanceError('version_not_found', 'Version does not belong to locale.');
        }
        const history = await storage.listActivationHistory(locale.id);
        if (!history.some((record) => record.catalogVersionId === version.id)) {
          throw new GovernanceError('invalid_transition', 'Only previously activated versions can be restored.');
        }
        await storage.setActiveVersion(locale.id, version.id, {
          id: idGenerator('activation'),
          localeId: locale.id,
          catalogVersionId: version.id,
          previousCatalogVersionId: locale.activeVersionId,
          action: 'rollback',
          actorId: actor.id,
          createdAt: clock(),
        });
        return version;
      });
    },

    getVersion: getVersionOrThrow,

    async getLocaleStatus(code) {
      const locale = await getLocaleOrThrow(code);
      const versions = await storage.listVersions(locale.id);
      const active = locale.activeVersionId
        ? versions.find((version) => version.id === locale.activeVersionId)
        : null;
      return {
        code: locale.code,
        sourceLocale: locale.sourceLocale,
        activeVersionId: locale.activeVersionId,
        activeState: active?.state ?? null,
        versions: versions.map(({ messages, ...version }) => version),
      };
    },

    async evaluateCiPolicy({ requiredLocales = [] } = {}) {
      const failures = [];
      for (const code of requiredLocales) {
        const locale = await storage.getLocale(normalizeLocale(code));
        if (!locale?.activeVersionId) {
          failures.push({ code: 'inactive_locale', locale: normalizeLocale(code) });
          continue;
        }
        const active = await storage.getVersion(locale.activeVersionId);
        if (active?.state === 'stale') {
          failures.push({ code: 'stale_catalog', locale: locale.code });
          continue;
        }
        if (active?.state !== 'active') {
          failures.push({ code: 'unapproved_active_version', locale: locale.code });
          continue;
        }
        const sourceLocale = await storage.getLocale(locale.sourceLocale);
        const sourceVersions = sourceLocale
          ? await storage.listVersions(sourceLocale.id)
          : [];
        const source = sourceVersions.at(-1);
        if (!source || active.sourceContentHash !== source.contentHash) {
          failures.push({ code: 'stale_catalog', locale: locale.code });
          continue;
        }
        const validation = await storage.getCurrentValidation(active.id);
        if (!validation?.passed || validation.contentHash !== active.contentHash) {
          failures.push({ code: 'validation_failed', locale: locale.code });
          continue;
        }
        const reviews = await storage.listReviews(active.id);
        const approvedRoles = new Set(
          reviews
            .filter((review) => review.decision === 'approved' && review.contentHash === active.contentHash)
            .map((review) => review.reviewerRole),
        );
        if (policy.requiredReviews.some((role) => !approvedRoles.has(role))) {
          failures.push({ code: 'approval_incomplete', locale: locale.code });
        }
      }
      return { passed: failures.length === 0, failures };
    },
  };
}
