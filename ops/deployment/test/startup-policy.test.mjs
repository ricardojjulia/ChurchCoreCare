import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical startup no longer starts or depends on a local database container', async () => {
  const source = await readFile(new URL('../../start-all.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /docker compose up -d mysql/);
  assert.doesNotMatch(source, /Docker Desktop/);
  assert.match(source, /requireDatabaseEnv/);
});

test('canonical startup isolates environment-specific web builds from tracked assets', async () => {
  const startupSource = await readFile(new URL('../../start-all.mjs', import.meta.url), 'utf8');
  const viteSource = await readFile(
    new URL('../../../apps/web/vite.config.js', import.meta.url),
    'utf8',
  );
  const serverSource = await readFile(
    new URL('../../../apps/web/server.js', import.meta.url),
    'utf8',
  );
  const gitignore = await readFile(new URL('../../../.gitignore', import.meta.url), 'utf8');

  assert.match(startupSource, /CHURCHCORE_WEB_OUT_DIR/);
  assert.match(startupSource, /WEB_BUILD_DIR/);
  assert.match(viteSource, /process\.env\.CHURCHCORE_WEB_OUT_DIR/);
  assert.match(serverSource, /process\.env\.WEB_BUILD_DIR/);
  assert.match(gitignore, /apps\/web\/\.runtime\//);
});

test('Vercel cold starts do not reserve a database session before a request needs one', async () => {
  const source = await readFile(
    new URL('../../../apps/api/src/index.js', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /if \(process\.env\.DB_NAME && process\.env\.VERCEL !== '1'\)/,
  );
});

test('local smoke and browser defaults target the canonical SaaS demo runtime', async () => {
  const smokeSource = await readFile(new URL('../../smoke-auth.mjs', import.meta.url), 'utf8');
  const uiScanSource = await readFile(
    new URL('../../../tests/e2e/ui-error-scan.mjs', import.meta.url),
    'utf8',
  );
  const helperSource = await readFile(
    new URL('../../../tests/e2e/helpers.mjs', import.meta.url),
    'utf8',
  );
  const uiBaselineSource = await readFile(
    new URL('../../../tests/e2e/ui-baseline.mjs', import.meta.url),
    'utf8',
  );
  const loadConfigSource = await readFile(
    new URL('../../../tests/load/k6/config.js', import.meta.url),
    'utf8',
  );
  const securitySource = await readFile(
    new URL('../../security-regression.mjs', import.meta.url),
    'utf8',
  );

  assert.match(smokeSource, /default: http:\/\/127\.0\.0\.1:3001/);
  assert.match(smokeSource, /http:\/\/127\.0\.0\.1:3001/);
  assert.doesNotMatch(smokeSource, /127\.0\.0\.1:3101/);

  for (const source of [uiScanSource, helperSource, uiBaselineSource, loadConfigSource, securitySource]) {
    assert.match(source, /elena\.martinez@example\.test/);
    assert.doesNotMatch(source, /sarah\.kim@example\.test/);
  }
});

test('trial status is fetched once and only for authenticated billing administrators', async () => {
  const appSource = await readFile(
    new URL('../../../apps/web/src/App.jsx', import.meta.url),
    'utf8',
  );
  const hookSource = await readFile(
    new URL('../../../apps/web/src/lib/useTrialStatus.js', import.meta.url),
    'utf8',
  );
  const bannerSource = await readFile(
    new URL('../../../apps/web/src/components/TrialBanner.jsx', import.meta.url),
    'utf8',
  );

  assert.match(appSource, /useTrialStatus\(isAuthenticated && isAdminRole\(userRole\)\)/);
  assert.match(appSource, /<TrialBanner trialStatus=\{trialStatus\} \/>/);
  assert.match(hookSource, /export function useTrialStatus\(enabled = false\)/);
  assert.match(hookSource, /if \(!enabled\)/);
  assert.doesNotMatch(bannerSource, /billing\/subscription/);
  assert.doesNotMatch(bannerSource, /useEffect/);
});
