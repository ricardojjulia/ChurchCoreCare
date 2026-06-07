#!/usr/bin/env node

import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGE_DIRS = [
  'packages/localization-governance-core',
  'packages/localization-governance-storage-filesystem',
  'packages/localization-governance-provider-google',
  'packages/localization-governance-cli',
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });
}

const temporary = await mkdtemp(path.join(os.tmpdir(), 'locgov-consumer-'));
const packs = path.join(temporary, 'packs');
const consumer = path.join(temporary, 'consumer');

try {
  await cp(path.join(ROOT, 'examples/localization-governance-consumer'), consumer, {
    recursive: true,
  });
  await import('node:fs/promises').then(({ mkdir }) => mkdir(packs, { recursive: true }));

  for (const packageDir of PACKAGE_DIRS) {
    run('pnpm', ['pack', '--pack-destination', packs], {
      cwd: path.join(ROOT, packageDir),
    });
  }

  const tarballs = (await readdir(packs)).filter((file) => file.endsWith('.tgz'));
  if (tarballs.length !== PACKAGE_DIRS.length) {
    throw new Error(`Expected ${PACKAGE_DIRS.length} tarballs, found ${tarballs.length}.`);
  }
  const packageJson = JSON.parse(await readFile(path.join(consumer, 'package.json'), 'utf8'));
  packageJson.dependencies = {
    '@localization-governance/core': `file:${path.join(packs, tarballs.find((file) => file.includes('core-0.1.0')))}`,
    '@localization-governance/storage-filesystem': `file:${path.join(packs, tarballs.find((file) => file.includes('storage-filesystem-0.1.0')))}`,
    '@localization-governance/provider-google': `file:${path.join(packs, tarballs.find((file) => file.includes('provider-google-0.1.0')))}`,
    '@localization-governance/cli': `file:${path.join(packs, tarballs.find((file) => file.includes('cli-0.1.0')))}`,
  };
  packageJson.pnpm = {
    overrides: {
      '@localization-governance/core': packageJson.dependencies['@localization-governance/core'],
    },
  };
  await writeFile(path.join(consumer, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  await writeFile(
    path.join(consumer, 'localization-governance.config.mjs'),
    `import { createGovernanceService } from '@localization-governance/core';
import { createFilesystemStorage } from '@localization-governance/storage-filesystem';
const storage = await createFilesystemStorage({ directory: './data' });
export default {
  service: createGovernanceService({ storage }),
  actor: { id: 'sample-cli', role: 'administrator' },
  requiredLocales: ['es-MX']
};
`,
  );

  run('pnpm', ['install', '--ignore-scripts'], { cwd: consumer });
  const appOutput = run('node', ['app.mjs'], { cwd: consumer, capture: true }).trim();
  const cliOutput = run(
    path.join(consumer, 'node_modules', '.bin', 'locgov'),
    ['status', 'es-MX', '--json', '--config', 'localization-governance.config.mjs'],
    { cwd: consumer, capture: true },
  ).trim();
  const appResult = JSON.parse(appOutput);
  const cliResult = JSON.parse(cliOutput);
  if (!appResult.passed || cliResult.code !== 'es-MX') {
    throw new Error('Packed consumer verification returned an unexpected result.');
  }
  console.log(JSON.stringify({
    passed: true,
    packages: Object.keys(packageJson.dependencies),
    activeVersionId: cliResult.activeVersionId,
  }, null, 2));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
