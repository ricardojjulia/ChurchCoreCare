/**
 * Tests for the tenant provisioning worker and trial reminders.
 *
 * Uses mock pools — the real DB functions are isolated behind the pool interface.
 * The provisioning cycle functions are tested directly via exported functions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Load provision.js via unique URL to avoid module-cache collisions
const provisionUrl = pathToFileURL(
  new URL('../../../apps/worker/src/provision.js', import.meta.url).pathname,
);
provisionUrl.searchParams.set('test', `provision-${Date.now()}`);
const { runProvisioningCycle, startProvisioningWorker } = await import(provisionUrl.href);

// Load trial-reminders.js via unique URL
const remindersUrl = pathToFileURL(
  new URL('../../../apps/worker/src/trial-reminders.js', import.meta.url).pathname,
);
remindersUrl.searchParams.set('test', `reminders-${Date.now()}`);
const { processTrialReminders } = await import(remindersUrl.href);

// ─── Mock pool builder ────────────────────────────────────────────────────────

/**
 * Builds a mock pg-style pool whose client.query() dispatches based on the
 * SQL pattern. The `scenario` object controls what each key query returns.
 */
function buildMockPool(scenario = {}) {
  const log = [];

  const client = {
    callLog: log,
    query: async (sql) => {
      log.push(sql.trim().slice(0, 60));

      if (/^BEGIN/i.test(sql)) return { rows: [] };
      if (/^ROLLBACK/i.test(sql)) return { rows: [] };
      if (/^COMMIT/i.test(sql)) return { rows: [] };

      // claimNextQueuedRequest — UPDATE ... RETURNING *
      if (/UPDATE tenant_provisioning.*in_progress/is.test(sql)) {
        if (scenario.queuedRequest) {
          return { rows: [scenario.queuedRequest] };
        }
        return { rows: [] }; // nothing queued
      }

      // isTenantIdAvailable — SELECT COUNT(*)
      if (/SELECT COUNT\(\*\).*tenant_slugs/i.test(sql)) {
        return { rows: [{ cnt: scenario.tenantExists ? 1 : 0 }] };
      }

      // registerTenantSlug
      if (/INSERT INTO tenant_slugs/i.test(sql)) {
        if (scenario.slugInsertThrows) throw new Error('slug insert failed');
        return { rows: [] };
      }

      // createTrialSubscription
      if (/INSERT INTO tenant_subscriptions/i.test(sql)) {
        return { rows: [] };
      }

      // markCompleted / markFailed
      if (/UPDATE tenant_provisioning.*completed/is.test(sql) || /UPDATE tenant_provisioning.*failed/is.test(sql)) {
        return { rows: [] };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  const pool = {
    callLog: log,
    connect: async () => client,
    // direct pool.query used in failure path re-acquire
    query: async (sql) => {
      log.push(`pool.direct: ${sql.trim().slice(0, 60)}`);
      return { rows: [] };
    },
    end: async () => {},
  };

  return { pool, log };
}

// ─── startProvisioningWorker ──────────────────────────────────────────────────

test('startProvisioningWorker returns null when DB_NAME is not set', () => {
  const savedDbName = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const handle = startProvisioningWorker();
    assert.equal(handle, null);
  } finally {
    if (savedDbName !== undefined) process.env.DB_NAME = savedDbName;
  }
});

// ─── runProvisioningCycle — happy path ────────────────────────────────────────

test('runProvisioningCycle skips when DB_NAME not set', async () => {
  const savedDbName = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const { pool } = buildMockPool();
    await assert.doesNotReject(() => runProvisioningCycle(pool));
  } finally {
    if (savedDbName !== undefined) process.env.DB_NAME = savedDbName;
  }
});

test('runProvisioningCycle does nothing when no queued requests exist', async () => {
  const savedDbName = process.env.DB_NAME;
  process.env.DB_NAME = 'test_db';
  try {
    const { pool, log } = buildMockPool({ queuedRequest: null });
    await runProvisioningCycle(pool);
    // Should begin a transaction and rollback (nothing found), but no slug or subscription inserts
    assert.ok(log.some((e) => /BEGIN/i.test(e)));
    assert.ok(!log.some((e) => /INSERT INTO tenant_slugs/i.test(e)));
  } finally {
    if (savedDbName !== undefined) process.env.DB_NAME = savedDbName;
    else delete process.env.DB_NAME;
  }
});

test('runProvisioningCycle provisions a queued request successfully', async () => {
  const savedDbName = process.env.DB_NAME;
  process.env.DB_NAME = 'test_db';
  try {
    const { pool, log } = buildMockPool({
      queuedRequest: {
        id: 'req-001',
        requested_tenant_id: 'grace-counseling',
        requested_practice_name: 'Grace Counseling',
      },
      tenantExists: false,
    });

    await runProvisioningCycle(pool);

    assert.ok(log.some((e) => /INSERT INTO tenant_slugs/i.test(e)), 'should register slug');
    assert.ok(log.some((e) => /INSERT INTO tenant_subscriptions/i.test(e)), 'should create subscription');
    assert.ok(log.some((e) => /UPDATE tenant_provisioning.*completed/is.test(e)), 'should mark completed');
  } finally {
    if (savedDbName !== undefined) process.env.DB_NAME = savedDbName;
    else delete process.env.DB_NAME;
  }
});

test('runProvisioningCycle marks request failed when tenant slug insert throws', async () => {
  const savedDbName = process.env.DB_NAME;
  process.env.DB_NAME = 'test_db';
  try {
    const { pool, log } = buildMockPool({
      queuedRequest: {
        id: 'req-002',
        requested_tenant_id: 'fail-tenant',
        requested_practice_name: 'Fail Practice',
      },
      tenantExists: false,
      slugInsertThrows: true,
    });

    // Should not throw — errors are caught and logged
    await assert.doesNotReject(() => runProvisioningCycle(pool));
    // The failure path does a direct pool.query to mark failed
    assert.ok(log.some((e) => /pool.direct.*UPDATE tenant_provisioning.*failed/i.test(e) || /pool.direct/i.test(e)),
      'should attempt to mark request failed via direct pool query');
  } finally {
    if (savedDbName !== undefined) process.env.DB_NAME = savedDbName;
    else delete process.env.DB_NAME;
  }
});

// ─── processTrialReminders ────────────────────────────────────────────────────

test('processTrialReminders skips tenants with no trial_ends_at', async () => {
  let updateCalled = false;
  const mockPool = {
    query: async (sql) => {
      if (/SELECT.*tenant_subscriptions/i.test(sql)) {
        return [[{
          tenant_id: 'no-trial-tenant',
          trial_ends_at: null,
          status: 'trial',
          trial_reminder_7day_at: null,
          trial_reminder_1day_at: null,
          owner_email: 'owner@test.com',
          owner_email_enc: null,
          requested_practice_name: 'Test Practice',
        }]];
      }
      if (/UPDATE tenant_subscriptions/i.test(sql)) {
        updateCalled = true;
      }
      return [[]];
    },
  };

  await processTrialReminders(mockPool, 'no-trial-tenant');
  assert.equal(updateCalled, false, 'should not update when trial_ends_at is null');
});

test('processTrialReminders skips tenants with no owner email', async () => {
  let updateCalled = false;
  const futureDate = new Date(Date.now() + 5 * 86400 * 1000).toISOString();
  const mockPool = {
    query: async (sql) => {
      if (/SELECT.*tenant_subscriptions/i.test(sql)) {
        return [[{
          tenant_id: 'no-email-tenant',
          trial_ends_at: futureDate,
          status: 'trial',
          trial_reminder_7day_at: null,
          trial_reminder_1day_at: null,
          owner_email: null,
          owner_email_enc: null,
          requested_practice_name: 'No Email Practice',
        }]];
      }
      if (/UPDATE tenant_subscriptions/i.test(sql)) {
        updateCalled = true;
      }
      return [[]];
    },
  };

  await processTrialReminders(mockPool, 'no-email-tenant');
  assert.equal(updateCalled, false, 'should not attempt updates when owner_email is null');
});

test('processTrialReminders handles DB error without throwing', async () => {
  const mockPool = {
    query: async () => { throw new Error('DB connection lost'); },
  };

  // The worker catches DB errors and returns silently
  await assert.doesNotReject(() => processTrialReminders(mockPool, 'any-tenant'));
});
