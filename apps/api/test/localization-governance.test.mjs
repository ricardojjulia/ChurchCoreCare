import test from 'node:test';
import assert from 'node:assert/strict';

import { GovernanceError } from '@localization-governance/core';
import {
  createChurchCoreLocalizationGovernance,
  mapGovernanceError,
} from '../src/lib/localization-governance.js';

function createStorage() {
  const locales = [
    {
      id: 'locale-en',
      code: 'en-US',
      sourceLocale: 'en-US',
      activeVersionId: 'version-en',
    },
    {
      id: 'locale-es',
      code: 'es-MX',
      sourceLocale: 'en-US',
      activeVersionId: 'version-es',
    },
    {
      id: 'locale-fr',
      code: 'fr-FR',
      sourceLocale: 'en-US',
      activeVersionId: null,
    },
  ];
  const versions = new Map([
    ['version-en', {
      id: 'version-en',
      localeId: 'locale-en',
      locale: 'en-US',
      state: 'active',
      messages: { hello: 'Hello' },
    }],
    ['version-es', {
      id: 'version-es',
      localeId: 'locale-es',
      locale: 'es-MX',
      state: 'legacy_unverified',
      messages: { hello: 'Hola' },
    }],
  ]);
  return {
    tenantId: 'tenant-a',
    async listLocales() { return structuredClone(locales); },
    async getLocale(code) { return structuredClone(locales.find((item) => item.code === code) ?? null); },
    async getVersion(id) { return structuredClone(versions.get(id) ?? null); },
  };
}

function createAssignmentRepository() {
  const assignments = [];
  const calls = [];
  const reviewers = new Set(['tenant-a:staff-reviewer']);
  return {
    assignments,
    calls,
    reviewers,
    async reviewerExists({ tenantId, reviewerId }) {
      calls.push({ operation: 'reviewerExists', tenantId, reviewerId });
      return reviewers.has(`${tenantId}:${reviewerId}`);
    },
    async list({ tenantId, localeId }) {
      calls.push({ operation: 'list', tenantId, localeId });
      return assignments.filter((item) => item.tenantId === tenantId && item.localeId === localeId);
    },
    async save(assignment) {
      calls.push({ operation: 'save', tenantId: assignment.tenantId });
      assignments.push(structuredClone(assignment));
      return structuredClone(assignment);
    },
  };
}

test('only practice administrators can assign reviewers', async () => {
  const governance = createChurchCoreLocalizationGovernance({
    tenantId: 'tenant-a',
    storage: createStorage(),
    assignmentRepository: createAssignmentRepository(),
    service: {},
    idGenerator: () => 'assignment-1',
    clock: () => '2026-06-07T00:00:00.000Z',
  });

  await assert.rejects(
    governance.assignReviewer({
      locale: 'es-MX',
      reviewerId: 'staff-reviewer',
      reviewerRole: 'linguistic',
      actor: { id: 'staff-counselor', role: 'counselor' },
    }),
    (error) => error.code === 'authorization_denied',
  );

  const assignment = await governance.assignReviewer({
    locale: 'es-MX',
    reviewerId: 'staff-reviewer',
    reviewerRole: 'linguistic',
    actor: { id: 'staff-admin', role: 'practice_admin' },
  });
  assert.equal(assignment.tenantId, 'tenant-a');
  assert.equal(assignment.reviewerRole, 'linguistic');
});

test('reviewer assignment cannot target another tenant reviewer', async () => {
  const governance = createChurchCoreLocalizationGovernance({
    tenantId: 'tenant-a',
    storage: createStorage(),
    assignmentRepository: createAssignmentRepository(),
    service: {},
  });

  await assert.rejects(
    governance.assignReviewer({
      locale: 'es-MX',
      reviewerId: 'staff-other-tenant',
      reviewerRole: 'linguistic',
      actor: { id: 'staff-admin', role: 'practice_admin' },
    }),
    (error) => error.code === 'reviewer_not_found',
  );
});

test('review submission requires a matching tenant assignment', async () => {
  const assignmentRepository = createAssignmentRepository();
  const submitted = [];
  const governance = createChurchCoreLocalizationGovernance({
    tenantId: 'tenant-a',
    storage: createStorage(),
    assignmentRepository,
    service: {
      async submitReview(input) {
        submitted.push(input);
        return { id: 'review-1' };
      },
    },
  });

  await assert.rejects(
    governance.submitReview({
      versionId: 'version-es',
      reviewerRole: 'linguistic',
      decision: 'approved',
      actor: { id: 'staff-reviewer', role: 'counselor' },
    }),
    (error) => error.code === 'reviewer_assignment_required',
  );

  assignmentRepository.assignments.push({
    tenantId: 'tenant-a',
    localeId: 'locale-es',
    reviewerId: 'staff-reviewer',
    reviewerRole: 'linguistic',
  });
  await governance.submitReview({
    versionId: 'version-es',
    reviewerRole: 'linguistic',
    decision: 'approved',
    actor: { id: 'staff-reviewer', role: 'counselor' },
  });
  assert.equal(submitted[0].reviewer.id, 'staff-reviewer');
  assert.equal(submitted[0].reviewer.role, 'linguistic');
});

test('runtime catalog reads expose source and active compatibility locales only', async () => {
  const governance = createChurchCoreLocalizationGovernance({
    tenantId: 'tenant-a',
    storage: createStorage(),
    assignmentRepository: createAssignmentRepository(),
    service: {},
  });

  assert.deepEqual(await governance.getRuntimeCatalog('es-MX'), {
    locale: 'es-MX',
    messages: { hello: 'Hola' },
    governanceState: 'legacy_unverified',
  });
  await assert.rejects(
    governance.getRuntimeCatalog('fr-FR'),
    (error) => error.code === 'locale_inactive',
  );
  assert.deepEqual(
    (await governance.listRuntimeLocales()).map((item) => item.code),
    ['en-US', 'es-MX'],
  );
});

test('governance errors map to bounded safe HTTP responses', () => {
  assert.deepEqual(mapGovernanceError(new GovernanceError('authorization_denied', 'denied')), {
    statusCode: 403,
    body: { error: 'Localization governance access denied.', code: 'authorization_denied' },
    auditResult: 'denied',
    reasonCode: 'rbac_denied',
  });
  assert.deepEqual(mapGovernanceError(new GovernanceError('storage_failure', 'password=secret')), {
    statusCode: 503,
    body: { error: 'Localization governance is temporarily unavailable.', code: 'storage_failure' },
    auditResult: 'error',
    reasonCode: 'dependency_failure',
  });
  assert.deepEqual(mapGovernanceError(new GovernanceError('reviewer_not_found', 'missing')), {
    statusCode: 404,
    body: { error: 'Localization governance record not found.', code: 'reviewer_not_found' },
    auditResult: 'failure',
    reasonCode: 'reviewer_not_found',
  });
  assert.deepEqual(mapGovernanceError({
    code: '42P01',
    message: 'relation localization_locales does not exist',
  }), {
    statusCode: 503,
    body: {
      error: 'Localization governance is temporarily unavailable.',
      code: 'storage_failure',
    },
    auditResult: 'error',
    reasonCode: 'dependency_failure',
  });
});
