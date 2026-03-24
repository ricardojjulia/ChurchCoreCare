# Faith Counseling

Christian counseling practice management SaaS for solo counselors, group practices, and multi-location clinics.

## Version

- Current release line: `0.1`
- Status: pre-beta

## Recent Changes Log

- React dashboard refresh:
	- Moved the main web experience onto the current React app shell and updated the primary dashboard title to `Practice HUB`.
- Workspace layout refinement:
	- Removed the top-bar client search input and added a dedicated `Clients` panel beside `Workspace Studio`.
- Live client data wiring:
	- Connected the `Clients` panel to `GET /api/v1/clients` with loading, empty, and error states.
- Monitoring improvements:
	- Expanded the monitor view to show 4xx totals, 5xx totals, and summarized API error status codes.
- Telemetry summary expansion:
	- Added request counts, error counts, status breakdowns, recent errors, average duration, and last-route details to service summaries.
- Build and asset serving fixes:
	- Corrected the Vite entry configuration, added the React entry HTML file, and reduced stale-bundle issues by disabling cache for built assets during local work.
- Documentation tracking:
	- Added an ongoing pre-beta development record in `docs/PRE-BETA-DEVELOPMENT.md` to capture current implementation changes and follow-ups.

For a detailed step-by-step history, see `docs/change-log.md`.
For current pre-beta implementation notes, see `docs/PRE-BETA-DEVELOPMENT.md`.

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
