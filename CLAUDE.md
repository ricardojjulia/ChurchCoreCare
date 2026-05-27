# ChurchCore Care — Project Instructions

ChurchCore Care is a faith-based Christian counseling practice platform. It manages clients, counselors, sessions, clinical assessments (PHQ-9, safety screenings), scheduling, billing, documents, and faith-integrated workflows.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Mantine UI v9, Tailwind CSS v4, JSX (not TypeScript) |
| Backend API | Node.js ESM, PostgreSQL (`pg`), argon2, custom session auth |
| Worker | Node.js ESM, PostgreSQL — background jobs and notifications |
| Domain package | `@churchcore/domain` — shared business logic |
| i18n package | `@churchcore/i18n` — internationalization |
| Telemetry package | `@churchcore/telemetry` — local monitoring (no OTEL exporters) |
| Database | PostgreSQL — migrations via `apps/api/src/db/migrate.js` |
| Tests | Node.js built-in test runner (`node --test`), Playwright for E2E |
| Package manager | pnpm workspaces |

---

## Repo structure

```
apps/
  api/      — Express-style Node.js API (src/index.js, src/lib/, src/middleware/, src/db/)
  web/      — React SPA (src/components/, src/lib/, src/App.jsx)
  worker/   — Background worker (src/index.js, src/notify.js)
packages/
  domain/   — Shared domain logic
  i18n/     — Translation strings and locale resolution
  telemetry/ — Local monitoring instrumentation
docs/       — Architecture docs, ADRs, runbooks, change-log
PLANS/      — Canonical plans (monitoring, security, surface registry)
ops/        — Dev scripts, start-all, demo dataset, security scans
```

---

## Commands

```sh
pnpm start              # canonical dev startup (env load, DB preflight, migrations, API+web)
pnpm test               # run all tests across all packages
pnpm lint               # lint all packages
node --test test/*.test.mjs  # run API unit tests directly
playwright test tests/e2e/  # E2E tests
pnpm run policy:tenant  # check tenant policy
pnpm run test:security  # security regression tests
```

---

## Architecture rules

- **Business logic lives in services or domain modules.** Route handlers stay thin.
- **Tenant isolation is enforced at the service layer**, not the route. Never skip it.
- **Worker handles all background jobs.** Do not add cron elsewhere.
- **Use the existing email/notify system** (`apps/worker/src/notify.js`). Do not add new ones.
- **Local monitoring must work without OTEL exporters.** Never add telemetry beacons or OTLP collectors.
- **Never emit PHI** (names, IDs, emails, clinical data) in monitoring metrics or log labels.
- **Audit ledger and monitoring are separate systems.** Never route audit rows through monitoring flows.
- **Soft-delete where appropriate** — check existing schema patterns before choosing hard delete.
- **No raw database errors exposed to the client.** Map to safe HTTP responses.
- **No raw payment payloads in logs.**

---

## Security and compliance

- All sessions use argon2 for password hashing.
- PHI data is encrypted at rest (`apps/api/src/lib/encrypt.js`).
- RBAC roles are enforced in `apps/api/src/middleware/` — never bypass middleware.
- Audit results must use canonical semantics: `success`, `failure`, `denied`, `error`.
- Read `PLANS/FULL-SECURITY-AND-AUDITING.md` before any change touching auth, RBAC, PHI, sessions, or exports.

---

## UI / Frontend rules

- Use Mantine v9 components as the primary UI library.
- Tailwind is used for utility classes alongside Mantine.
- Follow existing component patterns in `apps/web/src/components/`.
- Every new visible surface (page, tab, major modal) must be added to the shared surface registry and the monitoring page.
- Read `PLANS/FULL-SURFACE-MONITORING.md` before any UI change touching dashboards, tabs, or health visibility.

---

## Testing conventions

- API unit tests live in `apps/api/test/` as `*.test.mjs` files.
- Cover: happy path, validation failure, not-found, and at least one auth/tenant boundary case.
- Do not mock the database unless existing tests already do.
- E2E tests use Playwright in `tests/e2e/`.
- Run `pnpm test` after every feature — it must pass before a PR is opened.

---

## Documentation requirements (every commit)

- Update `README.md` for any affected section (features, setup, known issues).
- Add an entry to `docs/change-log.md` using the correct format (fix/feat/release).
- For version bumps: create `docs/vX.Y.Z-RELEASE-SUMMARY.md`.

---

## Git and delivery

- **Never push directly to main.** Always use a feature branch.
- Open a pull request with: what changed, why, validation performed, follow-up actions.
- Signed commits required.
- Pre-push hook lives at `.githooks/pre-push` — enable with `git config core.hooksPath .githooks`.
- Do not use `--no-verify` or destructive git commands unless explicitly asked.

---

## Key reference docs

| Document | When to read |
|---|---|
| `AGENTS.md` | At the start of every task — session-level rules |
| `PLANS/FULL-SURFACE-MONITORING.md` | Any UI, monitoring, health, or tab change |
| `PLANS/FULL-SECURITY-AND-AUDITING.md` | Any auth, RBAC, PHI, audit, or export change |
| `docs/adr/` | Before contradicting a past architecture decision |
| `apps/api/src/db/schema.sql` | Source of truth for the data model |
| `apps/api/src/lib/` | Core services: auth, encryption, feature flags, tenant provisioning |
| `docs/change-log.md` | Recent changes; always update on commit |

---

## Don't do

- Do not introduce OTEL exporters, browser telemetry beacons, or external collectors.
- Do not edit DB migrations after they have been merged.
- Do not expose raw database or Stripe errors to clients.
- Do not log PHI in any form.
- Do not skip tenant isolation checks — even in dev or test code.
- Do not add a new dependency without explicit user approval.
- Do not refactor code outside the agreed task scope.
