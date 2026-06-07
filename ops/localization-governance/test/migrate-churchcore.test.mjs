import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createFilesystemStorage } from '../../../packages/localization-governance-storage-filesystem/src/index.js';
import {
  planChurchCoreMigration,
  runChurchCoreMigration,
} from '../migrate-churchcore.mjs';

const sourceMessages = {
  hello: 'Hello',
  welcome: 'Welcome {name}',
};

const catalogs = {
  'es-MX': {
    __label: 'Español',
    __meta: {
      machineTranslated: { hello: true },
      humanReviewed: { welcome: true },
    },
    hello: 'Hola',
    welcome: 'Bienvenido {name}',
  },
  'fr-FR': { __label: 'Français' },
  'pt-BR': { __label: 'Português' },
};

test('plans source, Spanish compatibility activation, and inactive draft locales without catalog text', () => {
  const plan = planChurchCoreMigration({ sourceMessages, catalogs });
  assert.deepEqual(plan.locales.map((locale) => [locale.code, locale.state]), [
    ['en-US', 'active'],
    ['es-MX', 'legacy_unverified'],
    ['fr-FR', 'draft'],
    ['pt-BR', 'draft'],
  ]);
  assert.equal(plan.locales.find((locale) => locale.code === 'es-MX').evidence.humanReviewedCount, 1);
  assert.equal(JSON.stringify(plan).includes('Hola'), false);
  assert.equal(JSON.stringify(plan).includes('Bienvenido'), false);
});

test('dry-run does not write and write mode is idempotent', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'locgov-migrate-'));
  try {
    const storage = await createFilesystemStorage({ directory });
    const dryRun = await runChurchCoreMigration({
      storage,
      sourceMessages,
      catalogs,
      write: false,
    });
    assert.equal(dryRun.written, false);
    assert.deepEqual(await storage.listLocales(), []);

    const first = await runChurchCoreMigration({
      storage,
      sourceMessages,
      catalogs,
      write: true,
    });
    const second = await runChurchCoreMigration({
      storage,
      sourceMessages,
      catalogs,
      write: true,
    });
    assert.equal(first.written, true);
    assert.equal(second.written, false);
    assert.equal((await storage.listLocales()).length, 4);

    const spanish = await storage.getLocale('es-MX');
    const spanishVersions = await storage.listVersions(spanish.id);
    assert.equal(spanish.activeVersionId, spanishVersions[0].id);
    assert.equal(spanishVersions[0].state, 'legacy_unverified');
    assert.equal(spanishVersions[0].provenance.humanReviewedCount, 1);

    const french = await storage.getLocale('fr-FR');
    assert.equal(french.activeVersionId, null);
    assert.equal((await storage.listVersions(french.id))[0].state, 'draft');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('migration write preserves compatibility evidence without approving Spanish', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'locgov-migrate-evidence-'));
  try {
    const storage = await createFilesystemStorage({ directory });
    await runChurchCoreMigration({
      storage,
      sourceMessages,
      catalogs,
      write: true,
    });
    const spanish = await storage.getLocale('es-MX');
    const version = (await storage.listVersions(spanish.id))[0];
    const history = await storage.listActivationHistory(spanish.id);

    assert.equal(version.state, 'legacy_unverified');
    assert.equal(version.approvedBy, undefined);
    assert.equal(version.provenance.machineTranslatedCount, 1);
    assert.equal(version.provenance.humanReviewedCount, 1);
    assert.equal(history[0].action, 'legacy_compatibility');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
