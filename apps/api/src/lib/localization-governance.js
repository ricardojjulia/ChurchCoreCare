import crypto from 'node:crypto';

import {
  GovernanceError,
  createGovernanceService,
  normalizeLocale,
} from '@localization-governance/core';
import { createGoogleTranslationProvider } from '@localization-governance/provider-google';
import { createPostgresStorage } from '@localization-governance/storage-postgres';

const ADMIN_ROLES = new Set(['platform_admin', 'practice_owner', 'practice_admin']);
const REVIEW_ROLES = new Set(['linguistic', 'domain', 'compliance']);
const RUNTIME_STATES = new Set(['active', 'stale', 'legacy_unverified']);

function rowsOf(result) {
  if (Array.isArray(result)) return result[0] ?? [];
  return result?.rows ?? [];
}

function requireAdmin(actor) {
  if (!actor?.id || !ADMIN_ROLES.has(actor.role)) {
    throw new GovernanceError('authorization_denied', 'Administrator role required.');
  }
}

function requireActor(actor) {
  if (!actor?.id) throw new GovernanceError('authorization_denied', 'Authenticated actor required.');
}

function normalizeAssignment(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    localeId: row.locale_id,
    reviewerId: row.reviewer_id,
    reviewerRole: row.reviewer_role,
    assignedBy: row.assigned_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export function createReviewerAssignmentRepository({ client }) {
  return {
    async reviewerExists({ tenantId, reviewerId }) {
      const result = await client.query(
        `SELECT 1
           FROM staff_accounts
          WHERE tenant_id = $1 AND id = $2
          LIMIT 1`,
        [tenantId, reviewerId],
      );
      return rowsOf(result).length > 0;
    },

    async list({ tenantId, localeId }) {
      const result = await client.query(
        `SELECT id, tenant_id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at
           FROM localization_review_assignments
          WHERE tenant_id = $1 AND locale_id = $2
          ORDER BY reviewer_role, reviewer_id`,
        [tenantId, localeId],
      );
      return rowsOf(result).map(normalizeAssignment);
    },

    async save(assignment) {
      const result = await client.query(
        `INSERT INTO localization_review_assignments
           (tenant_id, id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, locale_id, reviewer_role, reviewer_id)
         DO UPDATE SET assigned_by = EXCLUDED.assigned_by
         RETURNING id, tenant_id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at`,
        [
          assignment.tenantId,
          assignment.id,
          assignment.localeId,
          assignment.reviewerId,
          assignment.reviewerRole,
          assignment.assignedBy,
          assignment.createdAt,
        ],
      );
      return normalizeAssignment(rowsOf(result)[0] ?? {
        id: assignment.id,
        tenant_id: assignment.tenantId,
        locale_id: assignment.localeId,
        reviewer_id: assignment.reviewerId,
        reviewer_role: assignment.reviewerRole,
        assigned_by: assignment.assignedBy,
        created_at: assignment.createdAt,
      });
    },
  };
}

export function createChurchCoreLocalizationGovernance({
  tenantId,
  client,
  storage = client ? createPostgresStorage({ client, tenantId }) : null,
  assignmentRepository = client ? createReviewerAssignmentRepository({ client }) : null,
  service,
  policy,
  idGenerator = (prefix) => `${prefix}-${crypto.randomUUID()}`,
  clock = () => new Date().toISOString(),
  provider,
} = {}) {
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new GovernanceError('storage_failure', 'tenantId is required.');
  }
  if (!storage) throw new GovernanceError('storage_failure', 'Localization storage is required.');
  if (!assignmentRepository) {
    throw new GovernanceError('storage_failure', 'Reviewer assignment repository is required.');
  }

  const providers = {};
  if (provider) providers.google = provider;
  else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    providers.google = createGoogleTranslationProvider({
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
    });
  }
  const governanceService = service ?? createGovernanceService({
    storage,
    providers,
    policy,
    idGenerator,
    clock,
  });
  const boundTenantId = tenantId.trim();

  return {
    storage,
    service: governanceService,

    async assignReviewer({ locale, reviewerId, reviewerRole, actor }) {
      requireAdmin(actor);
      if (!REVIEW_ROLES.has(reviewerRole)) {
        throw new GovernanceError('review_role_not_required', 'Invalid reviewer role.');
      }
      if (typeof reviewerId !== 'string' || !reviewerId.trim()) {
        throw new GovernanceError('validation_failed', 'reviewerId is required.');
      }
      if (assignmentRepository.reviewerExists) {
        const exists = await assignmentRepository.reviewerExists({
          tenantId: boundTenantId,
          reviewerId: reviewerId.trim(),
        });
        if (!exists) {
          throw new GovernanceError('reviewer_not_found', 'Reviewer not found.');
        }
      }
      const localeRecord = await storage.getLocale(normalizeLocale(locale));
      if (!localeRecord) throw new GovernanceError('locale_not_found', 'Locale not found.');
      return assignmentRepository.save({
        id: idGenerator('review-assignment'),
        tenantId: boundTenantId,
        localeId: localeRecord.id,
        reviewerId: reviewerId.trim(),
        reviewerRole,
        assignedBy: actor.id,
        createdAt: clock(),
      });
    },

    async listReviewerAssignments({ locale, actor }) {
      requireAdmin(actor);
      const localeRecord = await storage.getLocale(normalizeLocale(locale));
      if (!localeRecord) throw new GovernanceError('locale_not_found', 'Locale not found.');
      return assignmentRepository.list({
        tenantId: boundTenantId,
        localeId: localeRecord.id,
      });
    },

    async submitReview({ versionId, reviewerRole, decision, comment = '', actor }) {
      requireActor(actor);
      const version = await storage.getVersion(versionId);
      if (!version) throw new GovernanceError('version_not_found', 'Version not found.');
      const assignments = await assignmentRepository.list({
        tenantId: boundTenantId,
        localeId: version.localeId,
      });
      const assigned = assignments.some((assignment) => (
        assignment.reviewerId === actor.id && assignment.reviewerRole === reviewerRole
      ));
      if (!assigned) {
        throw new GovernanceError(
          'reviewer_assignment_required',
          'Matching reviewer assignment is required.',
        );
      }
      return governanceService.submitReview({
        versionId,
        reviewer: { id: actor.id, role: reviewerRole },
        decision,
        comment,
      });
    },

    async validateVersion(input) {
      requireAdmin(input.actor);
      return governanceService.validateVersion(input);
    },

    async approveVersion(input) {
      requireAdmin(input.actor);
      return governanceService.approveVersion(input);
    },

    async activateVersion(input) {
      requireAdmin(input.actor);
      return governanceService.activateVersion(input);
    },

    async rollbackLocale(input) {
      requireAdmin(input.actor);
      return governanceService.rollbackLocale(input);
    },

    async getStatus(locale) {
      return governanceService.getLocaleStatus(locale);
    },

    async listRuntimeLocales() {
      const locales = await storage.listLocales();
      const result = [];
      for (const locale of locales) {
        if (!locale.activeVersionId) continue;
        const version = await storage.getVersion(locale.activeVersionId);
        if (!version || !RUNTIME_STATES.has(version.state)) continue;
        result.push({ code: locale.code, governanceState: version.state });
      }
      return result.sort((left, right) => left.code.localeCompare(right.code));
    },

    async getRuntimeCatalog(locale) {
      const code = normalizeLocale(locale);
      const localeRecord = await storage.getLocale(code);
      if (!localeRecord?.activeVersionId) {
        throw new GovernanceError('locale_inactive', 'Locale is not active.');
      }
      const version = await storage.getVersion(localeRecord.activeVersionId);
      if (!version || !RUNTIME_STATES.has(version.state)) {
        throw new GovernanceError('locale_inactive', 'Locale is not active.');
      }
      return {
        locale: code,
        messages: structuredClone(version.messages),
        governanceState: version.state,
      };
    },
  };
}

export function mapGovernanceError(error) {
  if (!(error instanceof GovernanceError)) {
    return {
      statusCode: 503,
      body: {
        error: 'Localization governance is temporarily unavailable.',
        code: 'storage_failure',
      },
      auditResult: 'error',
      reasonCode: 'dependency_failure',
    };
  }
  const code = error?.code ?? 'unexpected_error';
  if (['authorization_denied', 'reviewer_assignment_required'].includes(code)) {
    return {
      statusCode: 403,
      body: { error: 'Localization governance access denied.', code },
      auditResult: 'denied',
      reasonCode: code === 'authorization_denied' ? 'rbac_denied' : 'reviewer_not_assigned',
    };
  }
  if (['locale_not_found', 'version_not_found', 'reviewer_not_found'].includes(code)) {
    return {
      statusCode: 404,
      body: { error: 'Localization governance record not found.', code },
      auditResult: 'failure',
      reasonCode: code,
    };
  }
  if (code === 'locale_inactive') {
    return {
      statusCode: 409,
      body: { error: 'Locale is not active.', code },
      auditResult: 'failure',
      reasonCode: code,
    };
  }
  if (['storage_failure', 'provider_failure'].includes(code)) {
    return {
      statusCode: 503,
      body: {
        error: 'Localization governance is temporarily unavailable.',
        code,
      },
      auditResult: 'error',
      reasonCode: 'dependency_failure',
    };
  }
  return {
    statusCode: 409,
    body: { error: 'Localization governance operation failed.', code },
    auditResult: 'failure',
    reasonCode: code,
  };
}
