import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { GovernanceError } from '@localization-governance/core';
import { createFilesystemStorage } from '../src/index.js';

async function withStorage(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'locgov-storage-'));
  try {
    const storage = await createFilesystemStorage({ directory });
    await run(storage, directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('persists locale, versions, validation, reviews, and activation history across reopen', async () => {
  await withStorage(async (storage, directory) => {
    const locale = { id: 'locale-1', code: 'es-MX', activeVersionId: null };
    const version = { id: 'version-1', localeId: locale.id, state: 'approved', messages: { hello: 'Hola' } };
    await storage.saveLocale(locale);
    await storage.saveVersion(version);
    await storage.saveValidationReport({ id: 'validation-1', catalogVersionId: version.id, passed: true });
    await storage.saveReview({ id: 'review-1', catalogVersionId: version.id, reviewerRole: 'linguistic' });
    await storage.setActiveVersion(locale.id, version.id, {
      id: 'activation-1',
      localeId: locale.id,
      catalogVersionId: version.id,
      action: 'activate',
    });

    const reopened = await createFilesystemStorage({ directory });
    assert.equal((await reopened.getLocale('es-MX')).activeVersionId, version.id);
    assert.equal((await reopened.getVersion(version.id)).messages.hello, 'Hola');
    assert.equal((await reopened.getCurrentValidation(version.id)).id, 'validation-1');
    assert.equal((await reopened.listReviews(version.id)).length, 1);
    assert.equal((await reopened.listActivationHistory(locale.id)).length, 1);
  });
});

test('rejects duplicate immutable versions and invalid identifiers', async () => {
  await withStorage(async (storage) => {
    await storage.saveVersion({ id: 'version-1', localeId: 'locale-1', messages: {} });
    await assert.rejects(
      storage.saveVersion({ id: 'version-1', localeId: 'locale-1', messages: {} }),
      (error) => error instanceof GovernanceError && error.code === 'version_conflict',
    );
    await assert.rejects(
      storage.saveVersion({ id: '../escape', localeId: 'locale-1', messages: {} }),
      (error) => error.code === 'invalid_identifier',
    );
  });
});

test('writes state through atomic temporary-file replacement', async () => {
  await withStorage(async (storage, directory) => {
    await storage.saveLocale({ id: 'locale-1', code: 'es-MX', activeVersionId: null });
    const files = await readdir(directory);
    assert.deepEqual(files, ['governance.json']);
    const persisted = JSON.parse(await readFile(path.join(directory, 'governance.json'), 'utf8'));
    assert.equal(persisted.locales['es-MX'].id, 'locale-1');
  });
});

test('serializes transactions', async () => {
  await withStorage(async (storage) => {
    const order = [];
    await Promise.all([
      storage.transaction(async () => {
        order.push('first-start');
        await new Promise((resolve) => setTimeout(resolve, 20));
        order.push('first-end');
      }),
      storage.transaction(async () => {
        order.push('second-start');
        order.push('second-end');
      }),
    ]);
    assert.deepEqual(order, ['first-start', 'first-end', 'second-start', 'second-end']);
  });
});

test('rolls back all in-memory and persisted changes when a transaction fails', async () => {
  await withStorage(async (storage, directory) => {
    await storage.saveLocale({ id: 'locale-1', code: 'es-MX', activeVersionId: null });

    await assert.rejects(
      storage.transaction(async () => {
        await storage.saveVersion({ id: 'version-1', localeId: 'locale-1', messages: {} });
        throw new Error('activation failed');
      }),
      /activation failed/,
    );

    assert.equal(await storage.getVersion('version-1'), null);
    const reopened = await createFilesystemStorage({ directory });
    assert.equal(await reopened.getVersion('version-1'), null);
  });
});
