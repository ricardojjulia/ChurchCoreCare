# Demo Documentation And es-PR Translation Design

**Status:** Approved
**Date:** June 8, 2026

## Scope

Deliver three related outcomes:

1. Put the ChurchCore Care demo environment information at the top of the
   repository README.
2. Provide a paste-ready AI prompt for installing the portable localization
   governance framework in the separate ChurchCore codebase.
3. Create and validate a complete Puerto Rican Spanish (`es-PR`) catalog in
   the existing governed localization lifecycle.

## Demo Documentation

The README will identify the environment as a synthetic-data demonstration
immediately after the product introduction. It will include:

- Hosted application URL and health URL.
- Synthetic-data-only and no-real-PHI boundary.
- Vercel and online Supabase architecture.
- Canonical local startup command and URLs.
- Deployment, database reset, and verification behavior.
- Links to the detailed SaaS and demo runbooks.

Credentials will not be embedded in the README. The README will point
operators to protected environment configuration and the guarded demo
runbooks.

## ChurchCore AI Prompt

The prompt will direct another coding agent to:

- Inspect the target repository before implementation.
- Install the packed `@localization-governance/*` packages.
- Keep product-specific code in thin adapters.
- Select filesystem or PostgreSQL storage based on the target architecture.
- Add migration, provider, CLI, CI, reviewer assignment, audit, and runtime
  integration.
- Enforce immutable versions, validation, human review, approval, activation,
  staleness, and rollback.
- Test packed tarballs in an external sample workspace.
- Use feature-branch, signed-commit, and pull-request delivery.

The prompt must not assume ChurchCore Care paths, schemas, roles, or HTTP
frameworks exist in ChurchCore.

## es-PR Catalog

`es-PR` is a distinct BCP 47 locale. It will not replace or relabel `es-MX`.

The catalog source of truth is `@churchcore/i18n` `baseMessages`, which is the
same merged English catalog used by runtime message resolution. Existing
`es-MX` values may seed Spanish wording, but their `legacy_unverified` state is
preserved as provenance rather than represented as human review.

The generated `es-PR` catalog must:

- Contain exactly the canonical source keys plus permitted metadata.
- Preserve placeholder names and counts.
- Contain no blank values.
- Apply Puerto Rican terminology where regional wording differs.
- Pass localization governance validation.
- Be written as a new immutable PostgreSQL catalog version for the `system`
  tenant.
- Stop at linguistic review readiness unless a real assigned reviewer submits
  approval.

No fabricated reviewer assignment, review decision, approval, or activation is
permitted.

## Verification

- Focused catalog-generation and governance tests.
- Full `pnpm lint` and `pnpm test`.
- Packed localization consumer verification.
- Online Supabase status query proving `es-PR` exists with a passing validation
  report and is not active.
- README links and hosted health endpoint verification.

