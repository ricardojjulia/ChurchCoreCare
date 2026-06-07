# Localization Governance Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the portable localization governance foundation as privately publishable npm packages, including an external tarball installation test.

**Architecture:** Implement a dependency-free governance core with explicit storage and translation-provider contracts. Add a filesystem adapter, Google provider, CLI, ChurchCore catalog migration command, CI policy gate, and an isolated sample consumer that installs only packed tarballs.

**Tech Stack:** Node.js 22 ESM, pnpm workspaces, Node built-in test runner, `Intl`, Web `fetch`, filesystem atomic rename, npm package tarballs.

---

## File Structure

```text
packages/localization-governance-core/
  package.json
  README.md
  CHANGELOG.md
  src/
    errors.js
    hash.js
    locale.js
    policy.js
    validator.js
    service.js
    index.js
  test/
    lifecycle.test.mjs
    validator.test.mjs

packages/localization-governance-storage-filesystem/
  package.json
  README.md
  CHANGELOG.md
  src/index.js
  test/storage.test.mjs

packages/localization-governance-provider-google/
  package.json
  README.md
  CHANGELOG.md
  src/index.js
  test/provider.test.mjs

packages/localization-governance-cli/
  package.json
  README.md
  CHANGELOG.md
  bin/locgov.js
  src/
    config.js
    format.js
    run.js
  test/cli.test.mjs

ops/localization-governance/
  migrate-churchcore.mjs
  test/migrate-churchcore.test.mjs
  verify-packed-consumer.mjs

examples/localization-governance-consumer/
  package.json
  app.mjs
  react-import.mjs

.github/workflows/ci.yml
package.json
pnpm-workspace.yaml
README.md
docs/change-log.md
```

The React package belongs to Slice 3. The external consumer in Slice 1 verifies
that no React or ChurchCore dependency leaks into the portable packages.

### Task 1: Scaffold Publishable Package Boundaries

**Files:**
- Create package manifests, READMEs, and changelogs for core, filesystem, Google provider, and CLI packages.
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/change-log.md`

- [ ] **Step 1: Add package-boundary test**

Create a root test script that executes package tests and confirms package
manifests use the `@localization-governance/*` scope, ESM exports, `files`
allowlists, and `publishConfig.access = "restricted"`.

- [ ] **Step 2: Run the boundary test**

Run:

```bash
node --test packages/localization-governance-*/test/*.test.mjs
```

Expected: FAIL because package files do not exist.

- [ ] **Step 3: Add package manifests**

Use version `0.1.0`, Node `>=22`, ESM, explicit exports, independent
`lint`/`test` scripts, and restricted publication metadata. Internal package
dependencies use exact version `0.1.0` so packed tarballs do not retain
workspace-only ranges.

- [ ] **Step 4: Run workspace install and package tests**

```bash
pnpm install
pnpm --filter '@localization-governance/*' test
```

Expected: package scripts execute successfully.

### Task 2: Implement Core Primitives And Deterministic Validation

**Files:**
- Create: `packages/localization-governance-core/src/errors.js`
- Create: `packages/localization-governance-core/src/hash.js`
- Create: `packages/localization-governance-core/src/locale.js`
- Create: `packages/localization-governance-core/src/policy.js`
- Create: `packages/localization-governance-core/src/validator.js`
- Create: `packages/localization-governance-core/src/index.js`
- Test: `packages/localization-governance-core/test/validator.test.mjs`

- [ ] **Step 1: Write validator tests**

Cover canonical BCP 47 validation, stable SHA-256 hashes, coverage capped at
100%, metadata exclusion, missing and blank keys, placeholder name/count
mismatches, locale plural categories, required/prohibited glossary terms,
untranslated source equality with allowlists, extras, deterministic check
ordering, and metadata-only diagnostics.

- [ ] **Step 2: Run validator tests**

```bash
pnpm --filter @localization-governance/core test
```

Expected: FAIL because exports are missing.

- [ ] **Step 3: Implement core primitives**

`validateCatalog()` returns:

```js
{
  passed,
  coverage,
  sourceContentHash,
  contentHash,
  checks: [{ code, severity, keys, count }]
}
```

Checks contain key names and counts but no source or target values.

- [ ] **Step 4: Run validator tests**

Expected: all validator tests pass.

### Task 3: Implement Governance Lifecycle Service

**Files:**
- Create: `packages/localization-governance-core/src/service.js`
- Modify: `packages/localization-governance-core/src/index.js`
- Test: `packages/localization-governance-core/test/lifecycle.test.mjs`

- [ ] **Step 1: Write lifecycle tests**

Cover locale creation, immutable versions, translation, validation,
review-request transitions, linguistic/domain/compliance decisions, bounded
comments, separation of duties, explicit approval, atomic activation through
the storage transaction contract, source-change staleness, rollback history,
typed errors, status output without messages, and CI policy outcomes.

- [ ] **Step 2: Run lifecycle tests**

Expected: FAIL because `createGovernanceService` is missing.

- [ ] **Step 3: Implement the service**

The service receives `{ storage, providers, policy, clock, idGenerator }`.
Every mutating method requires an actor object. Review submission never performs
final approval. Activation verifies current source hash, validation hash, and
all configured approvals.

- [ ] **Step 4: Run core tests**

```bash
pnpm --filter @localization-governance/core test
```

Expected: validator and lifecycle tests pass.

### Task 4: Implement Atomic Filesystem Storage

**Files:**
- Create: `packages/localization-governance-storage-filesystem/src/index.js`
- Test: `packages/localization-governance-storage-filesystem/test/storage.test.mjs`

- [ ] **Step 1: Write storage tests**

Cover repository initialization, path traversal rejection, CRUD operations,
immutable version conflicts, current validation selection, review history,
activation history, transaction serialization, atomic manifest replacement,
rollback, and reopening persisted state.

- [ ] **Step 2: Run storage tests**

Expected: FAIL because `createFilesystemStorage` is missing.

- [ ] **Step 3: Implement filesystem storage**

Use validated opaque IDs as filenames. Write JSON to a same-directory temporary
file, sync, close, rename, and clean temporary files after failures.
`transaction(callback)` serializes callbacks with an in-process promise queue.

- [ ] **Step 4: Run filesystem and core tests**

```bash
pnpm --filter @localization-governance/storage-filesystem test
pnpm --filter @localization-governance/core test
```

Expected: all pass.

### Task 5: Implement Google Translation Provider

**Files:**
- Create: `packages/localization-governance-provider-google/src/index.js`
- Test: `packages/localization-governance-provider-google/test/provider.test.mjs`

- [ ] **Step 1: Write provider contract tests**

Cover missing API key, empty message batch, request body, BCP 47 target language,
HTML entity decoding, source key preservation, abort signal forwarding,
non-success HTTP responses, and malformed provider payloads.

- [ ] **Step 2: Run provider tests**

Expected: FAIL because `createGoogleTranslationProvider` is missing.

- [ ] **Step 3: Implement provider**

Inject `fetch` for testing. Return `{ messages, provenance }`; never persist or
log credentials or catalog values.

- [ ] **Step 4: Run provider tests**

Expected: all pass.

### Task 6: Implement CLI And CI Enforcement

**Files:**
- Create: `packages/localization-governance-cli/bin/locgov.js`
- Create: `packages/localization-governance-cli/src/config.js`
- Create: `packages/localization-governance-cli/src/format.js`
- Create: `packages/localization-governance-cli/src/run.js`
- Test: `packages/localization-governance-cli/test/cli.test.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write CLI tests**

Cover command parsing and execution for locale creation, translation,
validation, review request/submission, approval, activation, rollback, status,
and CI. Assert stable JSON output and exit codes `0`, `1`, `2`, and `3`.

- [ ] **Step 2: Run CLI tests**

Expected: FAIL because the executable is missing.

- [ ] **Step 3: Implement CLI**

Load a JavaScript config file that constructs storage, providers, policy, and
actor resolution. `locgov ci` is read-only and emits no catalog values.

- [ ] **Step 4: Add root and CI commands**

Add:

```json
"localization:test": "pnpm --filter '@localization-governance/*' test",
"localization:ci": "locgov ci --config localization-governance.config.mjs"
```

CI runs package tests unconditionally. Product policy enforcement runs only
after the ChurchCore migration/configuration slice creates governed state, so
Slice 1 does not block existing deployments prematurely.

- [ ] **Step 5: Run CLI and package tests**

Expected: all pass.

### Task 7: Implement ChurchCore Migration Tooling

**Files:**
- Create: `ops/localization-governance/migrate-churchcore.mjs`
- Create: `ops/localization-governance/test/migrate-churchcore.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write migration tests**

Use temporary copies of source and target catalogs. Cover dry-run, import of
`en-US`, Spanish metadata preservation, Spanish `legacy_unverified`
compatibility activation, inactive French/Portuguese drafts, idempotent reruns,
hash summaries, and no catalog text in command output.

- [ ] **Step 2: Run migration tests**

Expected: FAIL because migration exports are missing.

- [ ] **Step 3: Implement migration**

Expose `planChurchCoreMigration()` and `runChurchCoreMigration()`. The CLI
defaults to dry-run and requires `--write` for persistence.

- [ ] **Step 4: Run migration tests and a repository dry-run**

```bash
node --test ops/localization-governance/test/*.test.mjs
pnpm localization:migrate --dry-run
```

Expected: tests pass and dry-run reports locale/version hashes and counts only.

### Task 8: Pack Tarballs And Verify An External Consumer

**Files:**
- Create: `examples/localization-governance-consumer/package.json`
- Create: `examples/localization-governance-consumer/app.mjs`
- Create: `ops/localization-governance/verify-packed-consumer.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write external-consumer verification**

The script creates a temporary directory outside the workspace package graph,
runs `pnpm pack` for each Slice 1 package, writes a package manifest containing
only `file:` tarball dependencies, installs with scripts disabled, and runs the
sample application.

- [ ] **Step 2: Run it before package export fixes**

```bash
node ops/localization-governance/verify-packed-consumer.mjs
```

Expected: FAIL if any package export or packed dependency is invalid.

- [ ] **Step 3: Fix package contents and sample**

The sample constructs a filesystem-backed service, creates and validates a
Spanish catalog, records linguistic review, approves, activates, reopens
storage, and confirms active status. It also invokes the packed CLI status
command.

- [ ] **Step 4: Run packed verification**

Expected: external install and execution pass without workspace links or
ChurchCore imports.

### Task 9: Documentation, Full Verification, And Validator Review

**Files:**
- Modify: `README.md`
- Modify: `docs/change-log.md`
- Create or update package READMEs and changelogs

- [ ] **Step 1: Document installation and lifecycle**

Document private registry authentication, package installation, service setup,
CLI commands, migration dry-run/write behavior, and packed-consumer
verification.

- [ ] **Step 2: Run the full verification gate**

```bash
pnpm lint
pnpm test
pnpm localization:test
pnpm localization:migrate --dry-run
pnpm localization:verify-pack
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 3: Run read-only implementation validation**

Review the diff against the approved story, design, AGENTS rules, monitoring
boundary, security boundary, documentation requirements, and all Slice 1
acceptance criteria. Resolve Critical findings before PR creation.

- [ ] **Step 4: Create signed implementation commit**

Stage only Slice 1 files and commit with `git commit -S`.

