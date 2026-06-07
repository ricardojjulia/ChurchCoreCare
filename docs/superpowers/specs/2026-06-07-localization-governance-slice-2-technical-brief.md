# Localization Governance Slice 2 Technical Brief

**Date:** 2026-06-07
**Status:** Approved for implementation

## Scope

Slice 2 moves the portable localization governance foundation into the
ChurchCore Care runtime without adding a new visible UI surface. The slice
adds tenant-scoped PostgreSQL persistence, governed API workflows, reviewer
assignment enforcement, migration support for the existing locale catalogs,
and CI/runtime verification.

## Data Model

Add an additive PostgreSQL migration that creates:

- `localization_locales`
- `localization_catalog_versions`
- `localization_validation_reports`
- `localization_review_assignments`
- `localization_review_decisions`
- `localization_activation_history`

All tables are tenant-keyed. Catalog versions, validation reports, review
decisions, reviewer assignments, and activation history must not be readable
or mutable without the current tenant predicate.

## Package Boundary

Create `@localization-governance/storage-postgres` as a reusable private npm
package. It accepts an injected PostgreSQL-compatible client and an explicit
`tenantId`; it does not own database credentials or application auth.

The package must preserve the portable core storage contract and support:

- Tenant-scoped reads and writes.
- Atomic activation and rollback.
- Row locking during activation.
- Validation report, review decision, and activation history persistence.
- Packed npm tarball installation in a separate sample workspace.

## API Boundary

ChurchCore Care exposes governed API routes for administrators:

- Status lookup.
- Validation.
- Reviewer assignment.
- Review submission.
- Approval.
- Activation.
- Rollback.

Legacy direct catalog mutation routes are blocked in database-backed
governance mode. Runtime locale and catalog reads remain compatible with the
existing `@churchcore/i18n` response shape, but only active, stale, or
legacy-compatibility versions are returned.

## Authorization

Only `platform_admin`, `practice_owner`, and `practice_admin` can validate,
assign reviewers, approve, activate, and roll back catalog versions.

Human review submission requires a matching reviewer assignment for the same
tenant, locale, reviewer id, and reviewer role. An administrator alone does not
satisfy the reviewer assignment requirement.

Reviewer assignment must verify the reviewer exists in the current tenant.

## Audit And Security

Every governed mutation emits a canonical audit event with result semantics:

- `success`
- `failure`
- `denied`
- `error`

Audit metadata must remain bounded and must not include PHI, free text,
catalog text, email addresses, names, or high-cardinality monitoring labels.
Audit ledger data and monitoring data remain separate systems.

## Migration

The ChurchCore migration supports:

- Dry run without database writes.
- PostgreSQL write mode for an explicit tenant.
- Idempotent repeated runs.
- Existing Spanish compatibility activation as `legacy_unverified`, preserving
  machine/human evidence without marking the catalog approved.
- French and Portuguese draft records that remain unavailable to runtime until
  activated.

## Verification

Required checks:

- Portable package unit tests.
- ChurchCore adapter and route tests.
- Migration tests.
- PostgreSQL integration script with tenant isolation, activation, rollback,
  and concurrent activation coverage.
- Packed npm tarball verification in a separate sample workspace.
- Repo lint and test gates.
