# AI Prompt: Install Localization Governance In ChurchCore

Paste the prompt below into Codex or another coding agent while its working
directory is the root of the **ChurchCore** repository.

```text
Implement the portable localization governance framework from ChurchCore Care
in this ChurchCore codebase. Treat this as production engineering work, not a
code-copy exercise.

Start with read-only repository research. Read this repository's AGENTS.md,
CLAUDE.md, README, package manifests, architecture docs, database migrations,
authentication/RBAC code, audit conventions, existing localization catalogs,
CI workflows, and deployment model. Identify the framework, package manager,
database, tenant model, identity model, and current translation flow. Present a
concise codebase map, user story, acceptance criteria, and technical brief for
approval before implementation. Follow this repository's branch, commit, test,
documentation, and pull-request rules.

Source framework:
- @localization-governance/core
- @localization-governance/storage-filesystem
- @localization-governance/storage-postgres
- @localization-governance/provider-google
- @localization-governance/cli

Obtain the packages by running `pnpm pack` in each matching package directory
of the ChurchCore Care repository, then install the resulting npm tarballs into
ChurchCore. Do not import ChurchCore Care source files by relative path. First
prove portability by installing the tarballs into a temporary sample workspace
outside both repositories and running a minimal lifecycle/status command.

Required architecture:
1. Keep @localization-governance/core framework-neutral. Put all ChurchCore
   assumptions in a thin adapter owned by ChurchCore.
2. Use the PostgreSQL adapter if ChurchCore has PostgreSQL and durable
   multi-user operation. Use filesystem storage only for local/single-user
   operation. Bind every database operation to the current tenant or equivalent
   product boundary.
3. Add additive migrations for locales, immutable catalog versions, validation
   reports, reviewer assignments, review decisions, and activation history.
   Never edit an already merged migration.
4. Integrate the current canonical source catalog without changing its runtime
   response shape. Existing translated catalogs must migrate with provenance;
   they must not be falsely marked human-approved.
5. Expose product-appropriate operator/API commands for status, catalog version
   creation or provider translation, validation, reviewer assignment, review
   submission, approval, activation, rollback, and CI policy evaluation.
6. Enforce lifecycle states:
   draft -> translated -> validated -> in_linguistic_review ->
   in_domain_review (when configured) -> approved -> active -> stale.
7. Automated translation and validation may never approve or activate.
   Human review requires an explicit assignment for the same tenant, locale,
   reviewer identity, and reviewer role. Separation of duties must be enforced
   when multiple reviewer roles are required.
8. Validate canonical-key coverage, blanks, exact placeholder names/counts,
   plural forms, required/prohibited glossary terms, untranslated values, and
   invalid extra keys. Coverage must be capped at 100 percent.
9. Source changes must mark affected approved/active target versions stale.
   Activation and rollback must be atomic and retain immutable history.
10. Translation provider credentials must remain in protected environment
    configuration. Never expose provider, database, service-role, or application
    secrets to browser code or commit them.
11. Audit governed mutations using ChurchCore's canonical audit result values.
    Keep diagnostics bounded and exclude catalog text, free text, names, emails,
    PHI, secrets, and high-cardinality monitoring labels.
12. Preserve runtime fallback to the source locale for inactive locales. Only
    active, stale-under-policy, or explicitly documented compatibility versions
    may be served.

Testing requirements:
- Core lifecycle and validator unit tests.
- Storage adapter tenant-isolation and atomic activation/rollback tests.
- ChurchCore adapter authorization and reviewer-assignment tests.
- Migration idempotency tests.
- CLI exit-code and machine-readable output tests.
- Source-change staleness tests.
- Packed-tarball consumer test in a separate temporary workspace.
- Existing repository lint, test, build, security, and policy gates.
- One end-to-end lifecycle that creates a locale, creates/translates a version,
  validates it, requests review, records a real assigned review in a test
  fixture, approves, activates, and rolls back.

Delivery requirements:
- Work on a feature branch; never push directly to main.
- Use test-driven development for behavior changes.
- Update README/setup/operations documentation and the repository change log.
- Document package installation, configuration, migration, status, translation,
  review, approval, activation, rollback, CI, and recovery commands.
- Run an independent pre-PR validator/code review and resolve all blockers.
- Use signed commits, push the branch, open a complete PR, wait for checks, and
  report the PR URL plus exact verification results.

Do not assume ChurchCore uses ChurchCore Care's paths, `system` tenant, roles,
HTTP routes, database schema, Vercel, Supabase, or React. Discover and adapt to
the target repository's actual architecture.
```
