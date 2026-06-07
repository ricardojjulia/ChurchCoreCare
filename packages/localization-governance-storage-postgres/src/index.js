import { AsyncLocalStorage } from 'node:async_hooks';

import { GovernanceError } from '@localization-governance/core';

function rowsOf(result) {
  if (Array.isArray(result)) return result[0] ?? [];
  return result?.rows ?? [];
}

function jsonValue(value) {
  if (typeof value === 'string') return JSON.parse(value);
  return structuredClone(value ?? {});
}

function timestamp(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function localeFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.locale_code,
    sourceLocale: row.source_locale,
    policyId: row.policy_id,
    activeVersionId: row.active_version_id,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function versionFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    localeId: row.locale_id,
    locale: row.locale_code,
    version: Number(row.version_number),
    sourceCatalogVersion: Number(row.source_catalog_version),
    sourceContentHash: row.source_content_hash,
    contentHash: row.content_hash,
    state: row.state,
    messages: jsonValue(row.messages),
    provenance: jsonValue(row.provenance),
    createdBy: row.created_by,
    ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
    ...(row.activated_at ? { activatedAt: timestamp(row.activated_at) } : {}),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function validationFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    catalogVersionId: row.catalog_version_id,
    validatorVersion: row.validator_version,
    contentHash: row.content_hash,
    sourceContentHash: row.source_content_hash,
    passed: row.passed,
    coverage: Number(row.coverage),
    checks: jsonValue(row.checks),
    createdAt: timestamp(row.created_at),
  };
}

function reviewFromRow(row) {
  return {
    id: row.id,
    catalogVersionId: row.catalog_version_id,
    contentHash: row.content_hash,
    reviewerId: row.reviewer_id,
    reviewerRole: row.reviewer_role,
    decision: row.decision,
    comment: row.comment,
    createdAt: timestamp(row.created_at),
  };
}

function activationFromRow(row) {
  return {
    id: row.id,
    localeId: row.locale_id,
    catalogVersionId: row.catalog_version_id,
    previousCatalogVersionId: row.previous_catalog_version_id,
    action: row.action,
    actorId: row.actor_id,
    createdAt: timestamp(row.created_at),
  };
}

function storageError(error, fallback = 'PostgreSQL governance storage failed.') {
  if (error instanceof GovernanceError) return error;
  return new GovernanceError('storage_failure', fallback, {
    cause: error?.code ?? error?.name ?? 'unknown',
  });
}

export function createPostgresStorage({ client, tenantId } = {}) {
  if (!client || typeof client.query !== 'function') {
    throw new GovernanceError('storage_failure', 'PostgreSQL client is required.');
  }
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new GovernanceError('storage_failure', 'tenantId is required.');
  }

  const boundTenantId = tenantId.trim();
  const transactionContext = new AsyncLocalStorage();

  async function query(sql, params = []) {
    const active = transactionContext.getStore() ?? client;
    return active.query(sql, params);
  }

  async function runTransaction(callback, api) {
    if (transactionContext.getStore()) return callback(api);
    if (typeof client.transaction === 'function') {
      return client.transaction((transactionClient) => (
        transactionContext.run(transactionClient, () => callback(api))
      ));
    }

    let connection = client;
    let releaseConnection = false;
    if (typeof client.getConnection === 'function') {
      connection = await client.getConnection();
      releaseConnection = true;
    } else if (typeof client.connect === 'function' && typeof client.totalCount === 'number') {
      const connected = await client.connect();
      if (connected?.query) {
        connection = connected;
        releaseConnection = true;
      }
    }
    const begin = connection.beginTransaction
      ? () => connection.beginTransaction()
      : () => connection.query('BEGIN');
    const commit = connection.commit
      ? () => connection.commit()
      : () => connection.query('COMMIT');
    const rollback = connection.rollback
      ? () => connection.rollback()
      : () => connection.query('ROLLBACK');

    await begin();
    try {
      const result = await transactionContext.run(connection, () => callback(api));
      await commit();
      return result;
    } catch (error) {
      await rollback();
      throw error;
    } finally {
      if (releaseConnection) connection.release?.();
    }
  }

  const api = {
    tenantId: boundTenantId,

    async transaction(callback) {
      try {
        return await runTransaction(callback, api);
      } catch (error) {
        throw storageError(error, 'PostgreSQL governance transaction failed.');
      }
    },

    async getLocale(code) {
      const result = await query(
        `SELECT id, locale_code, source_locale, policy_id, active_version_id, created_at, updated_at
           FROM localization_locales
          WHERE tenant_id = $1 AND locale_code = $2`,
        [boundTenantId, code],
      );
      return localeFromRow(rowsOf(result)[0]);
    },

    async saveLocale(locale) {
      await query(
        `INSERT INTO localization_locales
           (tenant_id, id, locale_code, source_locale, policy_id, active_version_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          boundTenantId,
          locale.id,
          locale.code,
          locale.sourceLocale,
          locale.policyId,
          locale.activeVersionId,
          locale.createdAt,
          locale.updatedAt,
        ],
      );
      return structuredClone(locale);
    },

    async listLocales() {
      const result = await query(
        `SELECT id, locale_code, source_locale, policy_id, active_version_id, created_at, updated_at
           FROM localization_locales
          WHERE tenant_id = $1
          ORDER BY locale_code`,
        [boundTenantId],
      );
      return rowsOf(result).map(localeFromRow);
    },

    async getVersion(id) {
      const result = await query(
        `SELECT v.*
           FROM localization_catalog_versions v
          WHERE v.tenant_id = $1 AND v.id = $2`,
        [boundTenantId, id],
      );
      return versionFromRow(rowsOf(result)[0]);
    },

    async saveVersion(version) {
      try {
        await query(
          `INSERT INTO localization_catalog_versions
             (tenant_id, id, locale_id, locale_code, version_number, source_catalog_version,
              source_content_hash, content_hash, state, messages, provenance, created_by,
              approved_by, activated_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            boundTenantId,
            version.id,
            version.localeId,
            version.locale,
            version.version,
            version.sourceCatalogVersion,
            version.sourceContentHash,
            version.contentHash,
            version.state,
            version.messages,
            version.provenance,
            version.createdBy,
            version.approvedBy ?? null,
            version.activatedAt ?? null,
            version.createdAt,
            version.updatedAt,
          ],
        );
        return structuredClone(version);
      } catch (error) {
        if (error?.code === '23505') {
          throw new GovernanceError('version_conflict', `Version already exists: ${version.id}`);
        }
        throw storageError(error);
      }
    },

    async updateVersion(version) {
      const result = await query(
        `UPDATE localization_catalog_versions
            SET locale_code = $2,
                version_number = $3,
                source_catalog_version = $4,
                source_content_hash = $5,
                content_hash = $6,
                state = $7,
                messages = $8,
                provenance = $9,
                created_by = $10,
                approved_by = $11,
                activated_at = $12,
                created_at = $13,
                updated_at = $14
          WHERE tenant_id = $1 AND id = $15
          RETURNING id`,
        [
          boundTenantId,
          version.locale,
          version.version,
          version.sourceCatalogVersion,
          version.sourceContentHash,
          version.contentHash,
          version.state,
          version.messages,
          version.provenance,
          version.createdBy,
          version.approvedBy ?? null,
          version.activatedAt ?? null,
          version.createdAt,
          version.updatedAt,
          version.id,
        ],
      );
      if (result?.rowCount === 0) {
        throw new GovernanceError('version_not_found', `Version not found: ${version.id}`);
      }
      return structuredClone(version);
    },

    async listVersions(localeId) {
      const result = await query(
        `SELECT v.*
           FROM localization_catalog_versions v
          WHERE v.tenant_id = $1 AND v.locale_id = $2
          ORDER BY v.version_number`,
        [boundTenantId, localeId],
      );
      return rowsOf(result).map(versionFromRow);
    },

    async saveValidationReport(report) {
      await query(
        `INSERT INTO localization_validation_reports
           (tenant_id, id, catalog_version_id, validator_version, content_hash,
            source_content_hash, passed, coverage, checks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (tenant_id, catalog_version_id)
         DO UPDATE SET id = EXCLUDED.id,
                       validator_version = EXCLUDED.validator_version,
                       content_hash = EXCLUDED.content_hash,
                       source_content_hash = EXCLUDED.source_content_hash,
                       passed = EXCLUDED.passed,
                       coverage = EXCLUDED.coverage,
                       checks = EXCLUDED.checks,
                       created_at = EXCLUDED.created_at`,
        [
          boundTenantId,
          report.id,
          report.catalogVersionId,
          report.validatorVersion,
          report.contentHash,
          report.sourceContentHash,
          report.passed,
          report.coverage,
          report.checks,
          report.createdAt,
        ],
      );
      return structuredClone(report);
    },

    async getCurrentValidation(versionId) {
      const result = await query(
        `SELECT *
           FROM localization_validation_reports
          WHERE tenant_id = $1 AND catalog_version_id = $2`,
        [boundTenantId, versionId],
      );
      return validationFromRow(rowsOf(result)[0]);
    },

    async saveReview(review) {
      try {
        await query(
          `INSERT INTO localization_review_decisions
             (tenant_id, id, catalog_version_id, content_hash, reviewer_id,
              reviewer_role, decision, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            boundTenantId,
            review.id,
            review.catalogVersionId,
            review.contentHash,
            review.reviewerId,
            review.reviewerRole,
            review.decision,
            review.comment,
            review.createdAt,
          ],
        );
        return structuredClone(review);
      } catch (error) {
        if (error?.code === '23505') {
          throw new GovernanceError('review_conflict', 'Reviewer decision already exists.');
        }
        throw storageError(error);
      }
    },

    async listReviews(versionId) {
      const result = await query(
        `SELECT *
           FROM localization_review_decisions
          WHERE tenant_id = $1 AND catalog_version_id = $2
          ORDER BY created_at, id`,
        [boundTenantId, versionId],
      );
      return rowsOf(result).map(reviewFromRow);
    },

    async setActiveVersion(localeId, versionId, activationRecord) {
      const lockResult = await query(
        `SELECT id, active_version_id
           FROM localization_locales
          WHERE tenant_id = $1 AND id = $2
          FOR UPDATE`,
        [boundTenantId, localeId],
      );
      const locale = rowsOf(lockResult)[0];
      if (!locale) throw new GovernanceError('locale_not_found', `Locale not found: ${localeId}`);
      const version = await api.getVersion(versionId);
      if (!version || version.localeId !== localeId) {
        throw new GovernanceError('version_not_found', 'Version does not belong to locale.');
      }
      await query(
        `UPDATE localization_locales
            SET active_version_id = $2, updated_at = $3
          WHERE tenant_id = $1 AND id = $4`,
        [boundTenantId, versionId, activationRecord.createdAt, localeId],
      );
      await query(
        `INSERT INTO localization_activation_history
           (tenant_id, id, locale_id, catalog_version_id, previous_catalog_version_id,
            action, actor_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          boundTenantId,
          activationRecord.id,
          localeId,
          versionId,
          activationRecord.previousCatalogVersionId ?? locale.active_version_id ?? null,
          activationRecord.action,
          activationRecord.actorId,
          activationRecord.createdAt,
        ],
      );
    },

    async listActivationHistory(localeId) {
      const result = await query(
        `SELECT *
           FROM localization_activation_history
          WHERE tenant_id = $1 AND locale_id = $2
          ORDER BY created_at, id`,
        [boundTenantId, localeId],
      );
      return rowsOf(result).map(activationFromRow);
    },
  };

  return api;
}
