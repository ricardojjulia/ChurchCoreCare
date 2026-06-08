# Demo Documentation And es-PR Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document the demo prominently, provide a portable ChurchCore installation prompt, and create a validated governed Puerto Rican Spanish catalog.

**Architecture:** README and prompt changes remain documentation-only. A focused operator script builds `es-PR` from the canonical `baseMessages`, uses existing Spanish only as seed provenance, writes an immutable tenant-bound PostgreSQL version, and invokes the existing governance service for validation without bypassing human review.

**Tech Stack:** Node.js 22 ESM, pnpm workspaces, PostgreSQL/Supabase, `@localization-governance/core`, `@localization-governance/storage-postgres`, Node test runner.

---

### Task 1: Prominent Demo Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/change-log.md`

- [ ] Add a `DEMO ENVIRONMENT` section immediately after the introduction.
- [ ] Include hosted URLs, synthetic-data boundary, Vercel/Supabase architecture,
      local startup, reset/verify commands, and runbook links.
- [ ] Verify no credentials or sensitive connection values appear.

### Task 2: ChurchCore Installation Prompt

**Files:**
- Create: `docs/prompts/install-localization-governance-in-churchcore.md`
- Modify: `README.md`

- [ ] Write a paste-ready prompt that starts with target-repository research.
- [ ] Require packed-tarball installation and external consumer verification.
- [ ] Require thin product adapters, lifecycle enforcement, tests, docs, and PR
      delivery without assuming ChurchCore Care internals.

### Task 3: es-PR Catalog Builder

**Files:**
- Create: `ops/localization-governance/build-es-pr.mjs`
- Create: `ops/localization-governance/test/build-es-pr.test.mjs`
- Create: `apps/api/data/i18n/es-PR.json`
- Modify: `package.json`

- [ ] Write a failing test requiring exact canonical-key coverage, placeholder
      preservation, Puerto Rican metadata, and no extra catalog keys.
- [ ] Implement deterministic catalog reconciliation using `baseMessages` and
      the Spanish seed catalog.
- [ ] Add `localization:build:es-pr` and `localization:publish:es-pr` commands.
- [ ] Generate and inspect the catalog.

### Task 4: Governed Supabase Publication

**Files:**
- Modify: `ops/localization-governance/build-es-pr.mjs`
- Modify: `ops/localization-governance/test/build-es-pr.test.mjs`

- [ ] Add an explicit `--postgres --tenant system --write` mode.
- [ ] Refuse local or implicit database destinations through existing database
      configuration guards.
- [ ] Create the locale only if absent and create an immutable next version.
- [ ] Run existing governance validation for the exact version content hash.
- [ ] Leave the passing version at `validated`; do not submit review, approve,
      or activate.
- [ ] Query online Supabase and confirm the locale, version, validation report,
      and inactive runtime status.

### Task 5: Repository Verification And Delivery

**Files:**
- Modify: `README.md`
- Modify: `docs/change-log.md`

- [ ] Run focused Node tests.
- [ ] Run `pnpm localization:test`.
- [ ] Run `pnpm localization:verify-pack`.
- [ ] Run `pnpm lint` and `pnpm test`.
- [ ] Run `git diff --check`.
- [ ] Run the ChurchCore Care PR validator.
- [ ] Create a signed commit, push the feature branch, open a complete PR, wait
      for checks, merge, and verify Vercel production health.

