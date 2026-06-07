import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import { GovernanceError } from '@localization-governance/core';

const INITIAL_STATE = Object.freeze({
  locales: {},
  versions: {},
  validations: {},
  reviews: {},
  activations: {},
});

function clone(value) {
  return structuredClone(value);
}

function assertIdentifier(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new GovernanceError('invalid_identifier', `Invalid storage identifier: ${value}`);
  }
}

async function loadState(file) {
  try {
    return { ...clone(INITIAL_STATE), ...JSON.parse(await readFile(file, 'utf8')) };
  } catch (error) {
    if (error.code === 'ENOENT') return clone(INITIAL_STATE);
    throw new GovernanceError('storage_failure', 'Unable to read governance storage.', {
      cause: error.code ?? error.name,
    });
  }
}

export async function createFilesystemStorage({ directory }) {
  if (typeof directory !== 'string' || !directory.trim()) {
    throw new GovernanceError('storage_failure', 'Filesystem storage directory is required.');
  }
  const root = path.resolve(directory);
  await mkdir(root, { recursive: true });
  const file = path.join(root, 'governance.json');
  let state = await loadState(file);
  let transactionQueue = Promise.resolve();
  let transactionDepth = 0;
  let transactionDirty = false;

  async function persist(force = false) {
    if (transactionDepth > 0 && !force) {
      transactionDirty = true;
      return;
    }
    const temporary = path.join(root, `.governance-${process.pid}-${Date.now()}.tmp`);
    const handle = await open(temporary, 'wx');
    try {
      await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      await rename(temporary, file);
    } catch (error) {
      await handle.close().catch(() => {});
      await rm(temporary, { force: true }).catch(() => {});
      throw new GovernanceError('storage_failure', 'Unable to persist governance storage.', {
        cause: error.code ?? error.name,
      });
    }
  }

  const api = {
    async transaction(callback) {
      const run = transactionQueue.then(async () => {
        const snapshot = clone(state);
        transactionDepth += 1;
        try {
          const result = await callback(api);
          transactionDepth -= 1;
          if (transactionDepth === 0 && transactionDirty) {
            transactionDirty = false;
            await persist(true);
          }
          return result;
        } catch (error) {
          state = snapshot;
          transactionDepth -= 1;
          if (transactionDepth === 0) transactionDirty = false;
          throw error;
        }
      });
      transactionQueue = run.catch(() => {});
      return run;
    },

    async getLocale(code) {
      return state.locales[code] ? clone(state.locales[code]) : null;
    },

    async saveLocale(locale) {
      assertIdentifier(locale.id);
      state.locales[locale.code] = clone(locale);
      await persist();
      return clone(locale);
    },

    async listLocales() {
      return Object.values(state.locales).map(clone);
    },

    async getVersion(id) {
      assertIdentifier(id);
      return state.versions[id] ? clone(state.versions[id]) : null;
    },

    async saveVersion(version) {
      assertIdentifier(version.id);
      assertIdentifier(version.localeId);
      if (state.versions[version.id]) {
        throw new GovernanceError('version_conflict', `Version already exists: ${version.id}`);
      }
      state.versions[version.id] = clone(version);
      await persist();
      return clone(version);
    },

    async updateVersion(version) {
      assertIdentifier(version.id);
      if (!state.versions[version.id]) {
        throw new GovernanceError('version_not_found', `Version not found: ${version.id}`);
      }
      state.versions[version.id] = clone(version);
      await persist();
      return clone(version);
    },

    async listVersions(localeId) {
      assertIdentifier(localeId);
      return Object.values(state.versions)
        .filter((version) => version.localeId === localeId)
        .sort((left, right) => left.version - right.version)
        .map(clone);
    },

    async saveValidationReport(report) {
      assertIdentifier(report.id);
      assertIdentifier(report.catalogVersionId);
      state.validations[report.catalogVersionId] = clone(report);
      await persist();
      return clone(report);
    },

    async getCurrentValidation(versionId) {
      assertIdentifier(versionId);
      return state.validations[versionId] ? clone(state.validations[versionId]) : null;
    },

    async saveReview(review) {
      assertIdentifier(review.id);
      assertIdentifier(review.catalogVersionId);
      state.reviews[review.catalogVersionId] = [
        ...(state.reviews[review.catalogVersionId] ?? []),
        clone(review),
      ];
      await persist();
      return clone(review);
    },

    async listReviews(versionId) {
      assertIdentifier(versionId);
      return clone(state.reviews[versionId] ?? []);
    },

    async setActiveVersion(localeId, versionId, activationRecord) {
      assertIdentifier(localeId);
      assertIdentifier(versionId);
      const localeEntry = Object.entries(state.locales)
        .find(([, locale]) => locale.id === localeId);
      if (!localeEntry) throw new GovernanceError('locale_not_found', `Locale not found: ${localeId}`);
      const [code, locale] = localeEntry;
      state.locales[code] = { ...locale, activeVersionId: versionId };
      state.activations[localeId] = [
        ...(state.activations[localeId] ?? []),
        clone(activationRecord),
      ];
      await persist();
    },

    async listActivationHistory(localeId) {
      assertIdentifier(localeId);
      return clone(state.activations[localeId] ?? []);
    },
  };

  return api;
}
