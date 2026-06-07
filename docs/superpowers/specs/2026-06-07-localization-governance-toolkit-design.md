# Localization Governance Toolkit Design

**Status:** Approved design
**Date:** June 7, 2026
**Initial consumer:** ChurchCore Care
**Package scope:** `@localization-governance/*`

## Purpose

Build a framework-neutral, privately published localization governance toolkit
that prevents translated catalogs from reaching production without repeatable
automated validation, documented human review, explicit approval, and
versioned activation.

ChurchCore Care will be the first consumer, but the toolkit must not contain
ChurchCore, counseling, Christian terminology, HTTP framework, UI framework,
database, or translation-vendor assumptions.

## User Story

As a software product team,
I want a reusable translation governance toolkit with configurable approvals,
automated quality gates, and portable storage and provider adapters,
so that translated locales cannot reach production without documented,
repeatable validation and review.

## Acceptance Criteria

1. Locale states follow an enforced lifecycle from draft through activation and
   staleness.
2. Coverage is capped at 100% and counts only canonical source keys.
3. Automated checks validate missing keys, placeholders, glossary terms,
   blanks, untranslated values, plural forms, and invalid extras.
4. Automated checks cannot approve or activate a locale.
5. Approval policies support linguistic review and optional domain or
   compliance review.
6. Review decisions record reviewer, role, timestamp, catalog version, outcome,
   and bounded comments.
7. Source-catalog changes mark affected approved or active locales stale.
8. Only an approved, current catalog can be activated.
9. Activation and rollback are atomic and retain immutable version history.
10. Core APIs remain framework-neutral.
11. Filesystem and PostgreSQL storage adapters are included.
12. Translation providers use a pluggable interface.
13. The CLI supports creation, translation, validation, review, approval,
    activation, rollback, status, and CI enforcement.
14. CI returns a nonzero result when governance policy fails.
15. Optional React administration components consume headless governance APIs.
16. ChurchCore Care uses a thin adapter without ChurchCore-specific logic in
    the reusable core.
17. Existing Spanish translations migrate without losing review evidence.
18. French and Portuguese remain inactive until governance requirements pass.
19. Governance diagnostics contain no PHI or catalog text unless explicitly
    requested in a secure review workflow.
20. Unit, integration, CLI, adapter, React, and ChurchCore end-to-end tests
    cover the lifecycle.

## Package Architecture

The private npm distribution consists of these packages:

| Package | Responsibility |
| --- | --- |
| `@localization-governance/core` | Lifecycle state machine, policies, validation, versioning, approvals, activation, rollback, and framework-neutral services |
| `@localization-governance/storage-filesystem` | Atomic JSON persistence, immutable snapshots, review history, and activation manifests |
| `@localization-governance/storage-postgres` | Transactional persistence, concurrency control, activation, and rollback |
| `@localization-governance/provider-google` | Google Translate integration behind the neutral provider contract |
| `@localization-governance/cli` | Operator commands and machine-readable CI enforcement |
| `@localization-governance/react` | Headless hooks and optional unstyled administration components |

Dependencies point inward:

```text
CLI / React / Product adapters
              |
        Governance Core
         /           \
 Storage adapters   Provider adapters
```

`@localization-governance/core` has no React, PostgreSQL, filesystem, HTTP, or
translation-provider dependency. Product integrations supply adapters and
identity or authorization decisions at their boundaries.

ChurchCore Care retains `@churchcore/i18n` as a compatibility adapter for its
existing formatting functions, message lookup, locale context, and API
integration.

## Domain Model

### Locale

Represents a governed target locale:

```js
{
  id,
  code,
  sourceLocale,
  policyId,
  activeVersionId,
  createdAt,
  updatedAt
}
```

Locale codes use canonical BCP 47 tags. Unknown or malformed tags are rejected
at the package boundary instead of silently resolving to the source locale.

### Catalog Version

Catalog versions are immutable after submission for review:

```js
{
  id,
  localeId,
  version,
  sourceCatalogVersion,
  sourceContentHash,
  contentHash,
  state,
  messages,
  provenance,
  createdBy,
  createdAt
}
```

`messages` may be stored separately by adapters, but the core contract treats
the catalog and hash as one immutable version. `provenance` records whether
keys were imported, machine translated, or manually authored without exposing
catalog text in ordinary status responses.

### Validation Report

```js
{
  id,
  catalogVersionId,
  validatorVersion,
  contentHash,
  passed,
  checks,
  createdAt
}
```

Each check reports a bounded code, severity, affected key names, and counts.
Catalog values are excluded from default diagnostic output.

### Review Decision

```js
{
  id,
  catalogVersionId,
  contentHash,
  reviewerId,
  reviewerRole,
  decision,
  comment,
  createdAt
}
```

Valid reviewer roles are `linguistic`, `domain`, and `compliance`. Valid
decisions are `approved` and `changes_requested`. Comments have a
product-configurable maximum length and are excluded from monitoring and audit
metadata.

### Activation Record

```js
{
  id,
  localeId,
  catalogVersionId,
  previousCatalogVersionId,
  action,
  actorId,
  createdAt
}
```

Valid actions are `activate`, `rollback`, and `legacy_compatibility`.

## Lifecycle

Canonical states:

```text
draft
  -> translated
  -> validated
  -> in_linguistic_review
  -> in_domain_review
  -> approved
  -> active
  -> stale
```

`in_domain_review` represents the remaining configured domain and compliance
review stages. It is skipped when the policy requires only linguistic review.

### Transition Rules

| From | To | Required condition |
| --- | --- | --- |
| `draft` | `translated` | Translation provider or manual import produced a target catalog |
| `draft` or `translated` | `validated` | Current validation report passes for the exact content hash |
| `validated` | `in_linguistic_review` | Review requested under the current policy |
| `in_linguistic_review` | `in_domain_review` | Linguistic approval recorded and additional reviews remain |
| `in_linguistic_review` | `approved` | Authorized `approveVersion` call verifies linguistic approval and confirms no additional reviews remain |
| `in_domain_review` | `approved` | Authorized `approveVersion` call verifies every configured reviewer role approved |
| `approved` | `active` | Source version and validation remain current; storage activation succeeds atomically |
| `approved` or `active` | `stale` | Canonical source content changes |
| `active` | prior `active` version | Authorized rollback creates an activation record atomically |

Review submission records evidence but never performs final approval.
Automated operations never create `approved` or `active` state. A failed
validation returns the version to `translated` or leaves a manually imported
version in `draft`. A `changes_requested` decision returns the catalog to
`draft`; editing it creates a new content hash and invalidates prior validation
and review decisions.

An active stale version remains servable under the default policy so that a
source update cannot remove an existing language from production. The CLI,
administration UI, and CI report the stale state until a replacement version is
approved and activated.

## Approval Policy

Default policy:

```js
{
  requiredReviews: ['linguistic'],
  separationOfDuties: true,
  requireFreshValidation: true,
  staleActiveBehavior: 'serve_with_warning',
  maxReviewCommentLength: 1000
}
```

Products may add `domain` or `compliance` to `requiredReviews`.

When multiple reviewer roles are required and `separationOfDuties` is true, one
identity cannot satisfy more than one required role for the same catalog
version. Reviewer assignment and authorization are provided by the consuming
product; the core verifies the supplied identity, role, policy, and prior
decisions.

## Validation Rules

Validation uses the canonical source catalog as the only key universe.

- Coverage equals translated canonical keys divided by canonical source keys.
  It is clamped to the range 0 through 100.
- Missing and blank target values fail validation.
- Target placeholders must exactly match source placeholder names and counts.
- Required plural categories are determined by `Intl.PluralRules` and package
  configuration.
- Required and prohibited glossary terms are checked by locale and namespace.
- Untranslated-value detection identifies values equal to source text, with an
  allowlist for product names, acronyms, and intentionally shared terms.
- Unknown target keys are reported as extras. Metadata keys explicitly declared
  by the storage format are not counted as catalog keys.
- Validation report content is deterministic for the same source, target,
  policy, glossary, and validator version.

Checks return stable codes suitable for CI and UI presentation:

```text
missing_key
blank_value
placeholder_mismatch
plural_form_missing
glossary_required_term_missing
glossary_prohibited_term_present
untranslated_value
extra_key
```

## Framework-Neutral Service Contract

```js
createGovernanceService({
  storage,
  providers,
  policy,
  clock,
  idGenerator
})
```

Primary operations:

```text
createLocale
createCatalogVersion
translateVersion
validateVersion
requestReview
submitReview
approveVersion
activateVersion
rollbackLocale
getLocaleStatus
evaluateCiPolicy
```

All mutations accept an actor context supplied by the consumer. The core
returns domain results and typed error codes; it does not make HTTP, RBAC,
session, or tenant decisions.

### Storage Contract

```js
storage.transaction(callback)
storage.getLocale(localeCode)
storage.saveLocale(locale)
storage.getVersion(versionId)
storage.saveVersion(version)
storage.listVersions(localeId)
storage.saveValidationReport(report)
storage.getCurrentValidation(versionId)
storage.saveReview(review)
storage.listReviews(versionId)
storage.setActiveVersion(localeId, versionId, activationRecord)
storage.listActivationHistory(localeId)
```

The filesystem adapter uses write-to-temporary-file, fsync where supported,
and atomic rename for manifests. The PostgreSQL adapter uses one transaction
and row-level locking for activation and rollback.

### Translation Provider Contract

```js
provider.translate({
  sourceLocale,
  targetLocale,
  messages,
  glossary,
  signal
})
```

Providers return translated messages plus bounded provenance metadata.
Credentials, retries, quotas, and vendor errors remain adapter concerns.

## CLI Contract

The executable is `localization-governance`, with `locgov` as a short alias.

```text
locgov locale create <locale>
locgov translate <locale> [--scope missing|full|<namespace>]
locgov validate <locale> [--version <id>]
locgov review submit <locale> --role <role> --decision <decision>
locgov approve <locale> [--version <id>]
locgov activate <locale> [--version <id>]
locgov rollback <locale> [--to <version>]
locgov status [<locale>]
locgov ci
```

Commands support human-readable output and `--json`. Exit codes are:

- `0`: operation or policy check passed
- `1`: governance policy failed
- `2`: invalid command or configuration
- `3`: storage or provider dependency failure

`locgov ci` is read-only. It fails when a configured required locale is
missing, inactive, stale beyond policy, based on an outdated source version, or
has no current passing validation and approvals.

## React Package

`@localization-governance/react` provides headless hooks and optional unstyled
components:

```text
GovernanceProvider
useLocales
useLocaleStatus
useCatalogVersion
useGovernanceActions
LocaleGovernancePanel
ValidationResults
ReviewQueue
ActivationHistory
```

The package communicates through a consumer-supplied client interface. It does
not assume REST paths, authentication, Mantine, Tailwind, or ChurchCore roles.
Components expose class names, render props, and event callbacks for product
styling and authorization.

## ChurchCore Care Integration

### Compatibility Adapter

`@churchcore/i18n` continues to expose current formatting and runtime lookup
functions. Its catalog loading path reads the active governed version through a
ChurchCore adapter. Existing callers do not import governance packages
directly.

### API

Existing catalog reads remain backward compatible. Governance mutations add
routes for validation, review, approval, activation, rollback, reviewer
assignments, and activation history. ChurchCore route handlers enforce session,
RBAC, reviewer assignment, and audit requirements before invoking the neutral
service.

Practice and platform administrators may manage locale configuration.
Administrative status alone does not grant a required reviewer role.

### Audit

Every ChurchCore governance mutation emits a separate audit event using
canonical result values:

```text
localization.catalog.validate
localization.review.submit
localization.catalog.approve
localization.locale.activate
localization.locale.rollback
```

Audit metadata contains opaque locale and version identifiers, reviewer role,
decision code, and result. It excludes catalog text, review comments, reviewer
names, and reviewer email addresses.

### Monitoring And UI

The existing `operations.language_studio` surface becomes the governance
administration UI. It must show loading, empty, denied, validation-failure,
review, stale, activation, and rollback states.

Before implementation changes this visible behavior,
`PLANS/FULL-SURFACE-MONITORING.md` must be updated. Monitoring receives only
aggregate lifecycle counts, validation failure counts, and operation outcomes.
It never receives catalogs, key names, review comments, identities, or raw
audit rows.

## Migration

Migration is additive and reversible:

1. Import `en-US` as the canonical source catalog and first source version.
2. Import `es-MX` as a target catalog version.
3. Preserve existing machine-translation and human-review metadata as
   historical evidence, not as automatic approval.
4. Create a `legacy_compatibility` activation record for Spanish so existing
   users do not lose their selected locale during migration.
5. Mark that activation `legacy_unverified` until Spanish passes current
   validation and configured human reviews.
6. Import `fr-FR` and `pt-BR` as inactive draft versions.
7. Retain existing catalog files until import verification, activation, and
   rollback tests pass.

The migration command is idempotent. Re-running it does not duplicate versions,
reviews, or activation records. A dry-run mode reports hashes, counts, and
planned actions without writing.

## Packaging And Publication

- Packages publish privately under `@localization-governance/*`.
- Every package has explicit ESM exports, package metadata, README, changelog,
  semantic version, and independent tests.
- Package manifests contain no workspace-only paths in published output.
- Publication uses packed artifacts, not source-directory assumptions.
- A sample external application installs the generated tarballs and exercises
  core, filesystem, CLI, and React imports.
- Public release is possible later without changing package APIs or names.

Adding third-party runtime dependencies requires explicit approval before
implementation. The initial design prefers Node.js built-ins and current
workspace dependencies where practical.

## Security And Privacy

- Core diagnostics are metadata-only by default.
- Catalog text is returned only by explicit catalog operations and secure review
  workflows.
- Logs, monitoring, CLI summaries, and audit metadata exclude catalog values,
  review comments, credentials, PHI, names, emails, and product record IDs.
- Storage adapters never infer tenant access. Consuming products must bind each
  service instance or repository operation to their authorization boundary.
- PostgreSQL queries are parameterized and activation uses transactional
  locking.
- Filesystem paths are derived from validated locale and version identifiers;
  caller-supplied path traversal is rejected.
- Provider credentials are read by provider adapters and never persisted in
  governance records.

## Error Handling

Core errors use stable codes, including:

```text
invalid_locale
invalid_transition
validation_failed
review_role_not_required
separation_of_duties_violation
stale_catalog
approval_incomplete
version_not_found
activation_conflict
storage_failure
provider_failure
```

Adapters preserve the stable code and attach non-sensitive causal metadata.
ChurchCore maps these errors to safe HTTP responses and emits separate audit
results of `failure`, `denied`, or `error` as appropriate.

## Test Strategy

### Core

- Every allowed and rejected lifecycle transition
- Approval-role combinations and separation of duties
- Content-hash invalidation of validation and reviews
- Source changes producing stale state
- Coverage clamped to 100%
- Every validation check and deterministic report output

### Adapters

- Filesystem atomic writes, interrupted writes, idempotency, and rollback
- PostgreSQL transactions, row locking, concurrent activation, and rollback
- Google provider request and normalized response contract

### CLI

- Every command's happy path and invalid transition
- Stable JSON output
- Exit codes `0` through `3`
- Read-only CI enforcement

### React

- Loading, empty, denied, failure, stale, review, and activation states
- Headless client contract and consumer-controlled authorization
- No dependency on ChurchCore or Mantine

### ChurchCore Care

- API RBAC and reviewer assignment
- Audit success, failure, denied, and error semantics
- Migration preservation and idempotency
- Spanish locale switch and raw-key regression sweep
- French and Portuguese unavailable until activation
- Language Studio lifecycle and rollback workflows
- Monitoring remains aggregate-only and local-first

### Portability

A separate sample application installs package tarballs and verifies:

- core service construction
- filesystem persistence
- CLI execution
- React package imports and rendering
- absence of ChurchCore-specific dependencies

## Delivery Slices

### Slice 1: Portable Foundation

Deliver core lifecycle and validation, filesystem storage, Google provider,
CLI, package metadata, migration tooling, CI enforcement, and portability
fixture.

### Slice 2: Durable ChurchCore Integration

Deliver PostgreSQL storage, ChurchCore compatibility adapter, API routes,
reviewer assignments, audit events, migration execution, and security tests.

### Slice 3: Governance Administration

Update the monitoring plan first, then deliver the React package, Language
Studio integration, browser validation, documentation, and private publication
readiness.

Each slice must be independently reviewable, tested, documented, committed with
signed commits, and delivered through a feature branch and pull request.

## Out Of Scope

- Hosted translation-management SaaS
- Billing or organization management
- Non-React UI packages
- Automated legal or regulatory certification
- Replacing professional translators with machine translation
- Runtime translation of PHI or user-authored clinical content
- Public npm publication in the initial release
