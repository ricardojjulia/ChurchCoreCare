# Operations Dashboard Implementation Log

**Date:** March 30, 2026
**Feature:** Operations Dashboard Upgrade
**Canonical plan:** [PLANS/OPERATIONS-DASHBOARD-UPGRADE.md](../PLANS/OPERATIONS-DASHBOARD-UPGRADE.md)

## Initial Planning Entry

### Objective

Replace the current placeholder Operations Dashboard cards with a production-ready daily operations summary for staff users.

### Approved Feature Scope

- `Today's Schedule`
  - counselor count with calendar entries
  - counselor workload graph
  - total 1-hour counselor gaps
- `Priority Queue`
  - count of clients marked high touchpoint
  - explanatory copy
- `Compliance Watch`
  - clients at 1 day, 3 days, and 1 week without locked notes after completed or checked-in sessions
  - assigned but incomplete documents/forms total
- `Clients`
  - total clients
  - clients without scheduled appointments
  - combined portal requests with separated status buckets

### Data Model Change

- Add `high_touchpoint` boolean to `clients`
- Default value: `false`
- Exposed to staff create/edit/read flows only

### API Change

Upgrade `GET /v1/operations/summary` to provide structured dashboard sections:

- `todaySchedule`
- `priorityQueue`
- `complianceWatch`
- `clientsBox`

Legacy `priorityItems` and `complianceItems` remain present as derived compatibility fields.

### Dashboard UI Goals

- Fetch operations summary through the React app on dashboard load
- Replace placeholder card text with metrics and workload visualization
- Keep the existing `dashboard` monitored surface
- Use Mantine/layout primitives only for the workload display

### Test Plan

- availability fallback and override calculations
- counselor workload and 1-hour gap math
- high-touchpoint client counting
- note-gap compliance thresholds
- incomplete documents/forms aggregation
- combined portal request aggregation
- dashboard render coverage and refresh behavior

## Step Log

### Step 0 — Planning checkpoint published

Planned outputs for the first Git checkpoint:

- [PLANS/OPERATIONS-DASHBOARD-UPGRADE.md](../PLANS/OPERATIONS-DASHBOARD-UPGRADE.md)
- this implementation log

No product code changes are included in the planning checkpoint.

### Step 1 — Client high-touchpoint foundation completed

Implemented:

- added `high_touchpoint` to the `clients` schema
- added migration compatibility for existing databases
- extended client create/read/update API payloads with `highTouchpoint`
- extended the shared client DB query mapper
- added staff-side editing in the existing client modal/form flow

Files touched in this step:

- `apps/api/src/db/schema.sql`
- `apps/api/src/db/migrate.js`
- `apps/api/src/db/queries/clients.js`
- `apps/api/src/index.js`
- `apps/web/src/components/ClientForm.jsx`

### Step 2 — Operations summary backend completed

Implemented:

- upgraded `GET /v1/operations/summary` to return:
  - `todaySchedule`
  - `priorityQueue`
  - `complianceWatch`
  - `clientsBox`
- preserved derived `priorityItems` and `complianceItems`
- added DB-aware summary loading for:
  - clients
  - appointments
  - progress notes
  - document assignments
  - form assignments
  - portal registration requests
  - portal appointment requests
  - staff availability templates
  - availability overrides
- added counselor workload and 1-hour gap calculations
- added note-gap compliance thresholds
- added combined portal-request aggregation with separated status buckets

Files touched in this step:

- `apps/api/src/index.js`

### Step 3 — Dashboard UI upgrade completed

Implemented:

- added operations-summary fetching in the React app for staff users
- added timed dashboard refresh while visible
- refreshed dashboard data after client and scheduling mutations
- replaced placeholder dashboard cards with:
  - Today’s Schedule metrics and counselor workload bars
  - Priority Queue high-touchpoint metric
  - Compliance Watch note-gap and incomplete-assignment metrics
  - Clients summary with portal request status breakdowns
- kept the client-create action in the dashboard while removing the roster from the dashboard card

Files touched in this step:

- `apps/web/src/App.jsx`
- `apps/web/src/components/WorkspaceGrid.jsx`
- `apps/web/src/components/SchedulingPage.jsx`
- `apps/web/src/lib/clientApi.js`
- `packages/i18n/src/index.js`

### Step 4 — Validation and release docs completed

Validation results:

- `node --env-file=.env apps/api/src/db/migrate.js` — passed
- `pnpm --filter @faith/api exec node --check src/index.js` — passed
- `pnpm lint` — passed
- `pnpm --filter @faith/web build` — passed
- `pnpm test:e2e` — passed (`9/9`)
- `pnpm test:launch-readiness` — passed (`3/3`)

Notes:

- initial migration failed because some older local databases did not yet include `clients.court_ordered`; the new `high_touchpoint` migration was updated to avoid positional `AFTER` dependence
- `launch-readiness` was rerun serially after `test:e2e` because both suites target the same `3001/3002` Playwright web-server ports

Final documentation outputs:

- [PLANS/OPERATIONS-DASHBOARD-UPGRADE.md](../PLANS/OPERATIONS-DASHBOARD-UPGRADE.md)
- [docs/OPERATIONS-DASHBOARD-IMPLEMENTATION-LOG-2026-03-30.md](./OPERATIONS-DASHBOARD-IMPLEMENTATION-LOG-2026-03-30.md)
- [docs/OPERATIONS-DASHBOARD-UPGRADE-SUMMARY.md](./OPERATIONS-DASHBOARD-UPGRADE-SUMMARY.md)
