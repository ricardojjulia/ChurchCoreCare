# Vercel And Supabase Demo Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy ChurchCore Care from GitHub to Vercel with a dedicated online Supabase database and an explicitly synthetic demo dataset.

**Architecture:** A root Vercel configuration builds the existing Vite app and routes `/api/*` to a Node Function adapter. The adapter delegates to the existing tenant-aware API request path. Separate guarded deployment scripts apply migrations, seed synthetic data, and import governed localization catalogs into Supabase.

**Tech Stack:** Node.js 22 ESM, Vite, Vercel Functions, PostgreSQL 17, Supabase CLI, pnpm workspaces.

---

### Task 1: Tenant-Aware Vercel API Adapter

**Files:**
- Modify: `apps/api/src/index.js`
- Create: `api/index.js`
- Create: `apps/api/test/vercel-adapter.test.mjs`

- [ ] Write a failing test that invokes the Vercel adapter with `/api/health` and expects the existing API health payload.
- [ ] Export a tenant-aware request function from the API server and make the local HTTP server delegate to it.
- [ ] Strip only the `/api` prefix in the Vercel adapter and preserve query strings.
- [ ] Prevent the API module from opening a listener when `VERCEL=1`.
- [ ] Run `node --test apps/api/test/vercel-adapter.test.mjs`.

### Task 2: Vercel Build And Route Configuration

**Files:**
- Create: `vercel.json`
- Modify: `package.json`
- Create: `ops/deployment/test/vercel-config.test.mjs`

- [ ] Write a failing configuration test for the root build command, output directory, API rewrite, SPA fallback, and function duration.
- [ ] Add `deploy:build` and deployment verification scripts.
- [ ] Add Vercel configuration that builds `apps/web/public`, preserves static files, and sends `/api/*` to the Node adapter.
- [ ] Run the configuration test and a local production build.

### Task 3: Demo Environment Guardrails

**Files:**
- Create: `apps/web/src/components/DemoEnvironmentBanner.jsx`
- Modify: `apps/web/src/App.jsx`
- Create: `ops/deployment/demo-guard.mjs`
- Create: `ops/deployment/test/demo-guard.test.mjs`
- Modify: `PLANS/FULL-SURFACE-MONITORING.md`

- [ ] Write failing tests proving seed operations require `DEMO_ENVIRONMENT=true`.
- [ ] Add a bounded guard helper that rejects accidental non-demo seeding.
- [ ] Add a visible synthetic-data banner controlled by `VITE_DEMO_ENVIRONMENT=true`.
- [ ] Document the banner as a shared existing-surface indicator in the monitoring plan.
- [ ] Run unit and web build checks.

### Task 4: Supabase Schema And Synthetic Seed Tooling

**Files:**
- Create: `ops/deployment/apply-supabase.mjs`
- Create: `ops/deployment/verify-supabase.mjs`
- Create: `ops/deployment/test/supabase-deployment.test.mjs`
- Modify: `ops/demo-dataset/apply-sql.mjs`
- Modify: `ops/demo-dataset/common.mjs`
- Modify: `package.json`

- [ ] Write failing tests for explicit demo guarding, PostgreSQL execution, and bounded verification output.
- [ ] Replace the legacy MySQL-only SQL apply path with the existing PostgreSQL client.
- [ ] Add an orchestrator that applies the canonical initial schema, incremental migrations, synthetic dataset, and localization migration.
- [ ] Add a verifier that checks expected tenant, staff, client, audit, and localization records without returning PHI.
- [ ] Run the deployment tooling tests against local PostgreSQL.

### Task 4A: Supabase-Only Runtime Policy

**Files:**
- Create: `apps/api/src/db/config.js`
- Modify: API, worker, migration, tenant provisioning, and startup DB configuration
- Create: focused database policy tests

- [ ] Require explicit online PostgreSQL connection values and TLS.
- [ ] Reject localhost, loopback, and Unix-socket database hosts at runtime.
- [ ] Remove Docker/local database startup from `pnpm start`.
- [ ] Keep isolated CI database fixtures explicitly test-only.

### Task 5: Documentation And External Configuration

**Files:**
- Modify: `README.md`
- Modify: `docs/change-log.md`
- Create: `docs/runbooks/vercel-supabase-demo.md`

- [ ] Document Vercel, Supabase, GitHub, environment variables, migration, seed, verification, rollback, and the no-PHI boundary.
- [ ] Create the GitHub-linked Vercel project `churchcore-care` under team `ChurchCore`.
- [ ] Configure `main` as production and store production secrets in Vercel.
- [ ] Apply the schema and synthetic dataset to Supabase.
- [ ] Deploy and verify health, login, client list, operations summary, monitoring, and localization.

### Task 6: Final Validation And Delivery

**Files:**
- Review all changed files.

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm policy:tenant`.
- [ ] Run the security regression against its development fixture.
- [ ] Run `pnpm deploy:build`.
- [ ] Run the implementation validator and resolve all blockers.
- [ ] Create a signed commit, push the feature branch, open a fully completed PR, and wait for required checks.
