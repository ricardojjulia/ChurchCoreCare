import test from 'node:test';
import assert from 'node:assert/strict';

import { GovernanceError } from '@localization-governance/core';
import { runCli } from '../src/run.js';

function harness(overrides = {}) {
  const calls = [];
  const service = new Proxy({}, {
    get(_target, method) {
      return async (payload) => {
        calls.push({ method, payload });
        if (method === 'evaluateCiPolicy') return overrides.ci ?? { passed: true, failures: [] };
        return overrides[method] ?? { id: `${String(method)}-result`, state: 'ok' };
      };
    },
  });
  const output = [];
  const errors = [];
  return {
    calls,
    output,
    errors,
    options: {
      loadConfig: async () => ({
        service,
        actor: { id: 'cli-user', role: 'administrator' },
        reviewer: { id: 'reviewer-1', role: 'linguistic' },
        requiredLocales: ['es-MX'],
      }),
      stdout: (value) => output.push(value),
      stderr: (value) => errors.push(value),
    },
  };
}

test('routes lifecycle commands to the service with actor context', async () => {
  const cases = [
    [['locale', 'create', 'es-MX', '--source', 'en-US'], 'createLocale'],
    [['translate', 'es-MX', '--version', 'v1', '--provider', 'google'], 'translateVersion'],
    [['validate', 'es-MX', '--version', 'v1'], 'validateVersion'],
    [['review', 'request', 'es-MX', '--version', 'v1'], 'requestReview'],
    [['review', 'submit', 'es-MX', '--version', 'v1', '--decision', 'approved'], 'submitReview'],
    [['approve', 'es-MX', '--version', 'v1'], 'approveVersion'],
    [['activate', 'es-MX', '--version', 'v1'], 'activateVersion'],
    [['rollback', 'es-MX', '--to', 'v0'], 'rollbackLocale'],
    [['status', 'es-MX'], 'getLocaleStatus'],
  ];

  for (const [argv, method] of cases) {
    const current = harness();
    const exitCode = await runCli({ argv, ...current.options });
    assert.equal(exitCode, 0);
    assert.equal(current.calls[0].method, method);
  }
});

test('emits stable JSON output', async () => {
  const current = harness();
  const exitCode = await runCli({ argv: ['status', 'es-MX', '--json'], ...current.options });
  assert.equal(exitCode, 0);
  assert.deepEqual(JSON.parse(current.output[0]), { id: 'getLocaleStatus-result', state: 'ok' });
});

test('returns exit code 1 when CI policy fails', async () => {
  const current = harness({ ci: { passed: false, failures: [{ code: 'stale_catalog', locale: 'es-MX' }] } });
  const exitCode = await runCli({ argv: ['ci', '--json'], ...current.options });
  assert.equal(exitCode, 1);
  assert.equal(JSON.parse(current.output[0]).passed, false);
});

test('returns exit code 2 for invalid commands and 3 for dependency failures', async () => {
  const invalid = harness();
  assert.equal(await runCli({ argv: ['unknown'], ...invalid.options }), 2);

  const dependency = harness();
  dependency.options.loadConfig = async () => {
    throw new GovernanceError('storage_failure', 'Storage unavailable');
  };
  assert.equal(await runCli({ argv: ['status', 'es-MX'], ...dependency.options }), 3);
});
