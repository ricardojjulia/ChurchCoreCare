# Faith Counseling

Christian counseling practice management SaaS for solo counselors, group practices, and multi-location clinics.

## Version

- Current release: `1.2.0`
- Status: production-ready (client module + MySQL persistence layer + Docker local DB)

## v1.2.0 — Docker Local Database, Env Loading Fix & Login Bug Fix (March 2026)

### Overview

Completes the local developer experience for the MySQL persistence layer. Adds a Docker Compose file for one-command database startup, fixes environment variable loading so the API always reads `.env` on start, and resolves a login regression where the session INSERT failed due to a missing `role` column in the staff account query.

### Changes

#### Docker Local Database

- `docker-compose.yml` added at repo root — starts MySQL 8 with persistent named volume (`faith_mysql_data`), healthcheck, and the `faith_app` user pre-configured
- Start the database: `docker compose up -d`
- Data persists across container restarts via the named volume

#### Environment Loading Fix

- `apps/api/package.json` `start` script updated from `node src/index.js` to `node --env-file=../../.env src/index.js`
- Previously, running `pnpm --filter @faith/api start` would launch the API without `.env` loaded, causing the DB connection to fail silently and fall back to anonymous credentials

#### Login Bug Fix

- `apps/api/src/lib/auth.js` — `login()` query was `SELECT sa.*, sm.first_name_enc, sm.last_name_enc` which omitted `sm.role`
- The `sessions` INSERT uses `account.role`, so `role` was `undefined` → MySQL `Column 'role' cannot be null` error
- Fixed by adding `sm.role` to the SELECT: `SELECT sa.*, sm.role, sm.first_name_enc, sm.last_name_enc`

#### Local Dev Quick Start

```bash
# 1. Start MySQL
docker compose up -d

# 2. Create all tables + seed dev account
node apps/api/src/db/migrate.js

# 3. Start the API (DB mode activates automatically via .env)
npx pnpm@10.7.0 --filter @faith/api start

# 4. Login
curl -s -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faithcounseling.local","password":"ChangeMe!Dev2024#"}'
```

### Bug Fixes

- API no longer connects anonymously when started via `pnpm start` without explicit env vars
- Login endpoint no longer throws `Column 'role' cannot be null` on first attempt

### Backward Compatibility

No breaking changes. In-memory mode (no `DB_NAME`) is unaffected.

See `docs/DATABASE-IMPLEMENTATION.md` for full setup reference.

---

## v1.1.0 — MySQL Persistence, PHI Encryption & Session Auth (March 2026)

### v1.1.0 Overview

Full database persistence layer replacing the in-memory store. Introduces MySQL-backed storage for all domains, AES-256-GCM field-level encryption for PHI columns, session-based authentication with argon2id password hashing, and persistent audit logging. The API operates in **dual mode**: when `DB_NAME` is set it routes all requests through parameterized MySQL queries; without it the in-memory fallback remains fully functional for local development and tests.

### New Features

#### Database Layer

- MySQL connection pool (`apps/api/src/db/pool.js`) with configurable SSL, connection limit, and UTC timezone
- Full DDL schema (`apps/api/src/db/schema.sql`) — 30+ tables across all domains
- Run-once migration script: `node apps/api/src/db/migrate.js`
- Per-domain query helper modules under `apps/api/src/db/queries/` — `clients.js`, `clinical.js`, `appointments.js`, `billing.js`, `documents.js`, `portal.js`, `staff.js`, `faith.js`, `platform.js`
- 83 `process.env.DB_NAME` guards wired into all major handlers — each falls back to in-memory when DB is not configured

#### PHI Encryption

- AES-256-GCM field-level encryption (`apps/api/src/lib/encrypt.js`) for all PHI columns
- Encrypted fields: client names, staff names/license/bio, location addresses, progress note summaries, treatment plan goals, emergency contacts, insurance info, portal emails, message content
- Key sourced from `DB_ENCRYPTION_KEY` env var (32-byte hex); format: `iv:authTag:ciphertext` (all base64)

#### Authentication

- Session-based login (`apps/api/src/lib/auth.js`) replacing insecure header-based identity
- `POST /v1/auth/login` — argon2id password verification, HttpOnly session cookie
- `POST /v1/auth/logout` — server-side session revocation
- `GET /v1/auth/me` — current session profile
- Sessions stored as SHA-256 token hashes in `sessions` table; sliding 8-hour idle timeout
- Account lockout after 10 failed attempts

#### Security

- Persistent audit events — all mutations write to `audit_events` table in addition to console log
- Parameterized queries throughout — no SQL string interpolation
- Staff accounts table with `failed_attempts`, `locked_until`, `last_login_at`, `mfa_enabled` columns

### New Environment Variables

```env
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
DB_ENCRYPTION_KEY  (openssl rand -hex 32)
```

See `docs/DATABASE-IMPLEMENTATION.md` for full setup instructions.

### v1.1.0 Backward Compatibility

Fully backward compatible. Without `DB_NAME` set, all behavior is identical to `v1.0.0`.

---

## v1.0.0 — Client Management Module (Major Release)

### Release Overview

Major release completing Phase 1 of the full client management suite. Implements comprehensive client CRUD operations with full UI integration, audit logging, and OpenAPI documentation.

### Release Features

#### API Enhancements

- `GET /v1/clients/{id}` — Retrieve single client with tenant-scoped access audit logging
- `DELETE /v1/clients/{id}` — Soft-delete (archive) client by setting status to inactive
- `PATCH /v1/clients/{id}` — Full client update with validation and appointment name sync
- All endpoints include tenant-scope enforcement, RBAC checks, and audit trail recording

#### React Components

- `ClientForm.jsx` — Reusable form component for create/edit workflows with validation
- `ClientModal.jsx` — Modal wrapper with backdrop and form integration
- Enhanced `WorkspaceGrid.jsx` — Edit/delete buttons on client list with real-time refresh

#### UI Features

- "New Client" button in Clients panel
- Inline edit on client name (opens modal with pre-populated data)
- Delete (archive) button with confirmation dialog
- Live client list with loading, error, and empty states
- Automatic refresh after add/edit/delete mutations

#### Documentation

- Updated OpenAPI specification with full `/v1/clients/{id}` path documentation
- Added `UpdateClientRequest` schema for PATCH operations
- Documented all status codes, request/response formats, and RBAC requirements

### Breaking Changes

None — fully backward compatible. Extends existing client functionality without modifying previous endpoints.

### Performance Improvements

- Form submission with client-side validation before API calls
- Optimistic UI updates with fallback error states
- Efficient refresh mechanism using state triggers
- Soft-delete prevents data loss while preserving referential integrity

### v1.0.0 Bug Fixes

- Previous build/serving issues resolved with Vite configuration
- Stale bundle issues mitigated with cache control headers

For a detailed feature breakdown, see `docs/RELEASE_1.0.0.md`.
For current implementation history, see `docs/PRE-BETA-DEVELOPMENT.md`.

## Initial Scope

This repository starts with the product and architecture foundation required before feature coding:

- product requirements and release scope
- domain model and permissions model
- architecture decision records
- initial API contracts
- HIPAA-ready security and compliance baseline
- monorepo structure for web, API, worker, shared packages, infrastructure, and operations

## Repository Layout

- `docs/` product, architecture, contracts, and compliance documents
- `apps/web/` responsive web application
- `apps/api/` HTTP API and tenant-aware application services
- `apps/worker/` background jobs for reminders, document processing, and audit support
- `packages/domain/` shared domain types and business concepts
- `infra/` infrastructure-as-code assets
- `ops/` operational runbooks and launch readiness procedures

## Technical Direction

The initial implementation follows a modular monolith approach with clear domain boundaries:

- one practice per tenant
- role-based access control and strict tenant scoping
- relational system of record for operational and clinical data
- encrypted object storage for documents and generated files
- immutable audit trail for PHI-sensitive actions
- responsive web-first product before native mobile apps

## Next Build Steps

1. Scaffold the web, API, and worker applications.
2. Implement tenant, staff, and client identity boundaries.
3. Build audit logging and permission enforcement before feature expansion.
4. Add practice administration, intake, scheduling, and chart workflows incrementally.

## Local Run

- Install dependencies:
  - `npx pnpm@10.7.0 install`
- Start API:
  - `npx pnpm@10.7.0 --filter @faith/api start`
- Start web (auto-builds bundled client first):
  - `npx pnpm@10.7.0 --filter @faith/web start`
- Start worker:
  - `npx pnpm@10.7.0 --filter @faith/worker start`

## Verification

- Step 12 API workflow validation:
  - `node ops/step12-validate.mjs`
- Focused security regression coverage:
  - `node ops/security-regression.mjs`
- High-value browser journeys with Playwright:
  - `npx playwright test tests/e2e/high-value-journeys.spec.mjs`
- Launch-readiness browser audits for accessibility and performance:
  - `npx playwright test tests/e2e/launch-readiness.spec.mjs`

## Telemetry & Performance

- Node services use OpenTelemetry initialization from `packages/telemetry/src/node.js`.
- Browser experience metrics use OpenTelemetry + `web-vitals` from `packages/telemetry/src/browser.js`.
- API telemetry summary endpoint:
  - `GET /v1/telemetry/summary`
- Web proxy telemetry summary endpoint:
  - `GET /telemetry/summary`
- Browser vitals ingestion endpoint:
  - `POST /v1/telemetry/vitals`

To export traces/metrics to an OTLP backend, set one or more environment variables before startup:

- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
- `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`

## Language / Translation Studio

UI copy is keyed and managed through `@faith/i18n` with runtime locale APIs:

- List/create locales:
  - `GET /v1/i18n/locales`
  - `POST /v1/i18n/locales`
- Load/save catalog:
  - `GET /v1/i18n/catalog?locale=<code>`
  - `PATCH /v1/i18n/catalog/<code>`
- Generate draft translations:
  - `POST /v1/i18n/translate`

If `GOOGLE_TRANSLATE_API_KEY` is set, draft translations are generated via Google Translate API.
If not set, the system generates safe prefixed placeholders (for example, `[es] ...`) so teams can still refine text manually.
