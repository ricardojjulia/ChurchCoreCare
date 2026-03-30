# Operations Dashboard Upgrade Summary

**Date:** March 30, 2026
**Status:** Implemented and validated
**Plan:** [PLANS/OPERATIONS-DASHBOARD-UPGRADE.md](../PLANS/OPERATIONS-DASHBOARD-UPGRADE.md)
**Implementation log:** [docs/OPERATIONS-DASHBOARD-IMPLEMENTATION-LOG-2026-03-30.md](./OPERATIONS-DASHBOARD-IMPLEMENTATION-LOG-2026-03-30.md)

## What shipped

The Operations Dashboard is now backed by a real operations-summary API instead of placeholder text.

### Today's Schedule

- total appointments for the day
- number of counselors with calendar entries
- counselor workload graph using utilization bars
- total 1-hour gaps remaining across available counselors

Availability math now:

- uses declared counselor availability templates when they exist
- applies same-day availability overrides
- falls back to `09:00-12:00` and `13:00-17:00` when no availability template exists

### Priority Queue

- now shows the count of clients explicitly marked `high touchpoint`
- includes staff-facing explanation text so the metric is self-describing

### Compliance Watch

- clients with unresolved locked-note gaps after their latest completed or checked-in session at:
  - 1 day
  - 3 days
  - 1 week
- assigned but incomplete:
  - documents
  - forms
  - total

### Clients

The dashboard Clients card now contains only:

- total clients
- clients without scheduled appointment
- portal request totals and statuses

Portal requests combine:

- public registration requests
- portal appointment requests

Status buckets remain separated by request type.

## Technical changes

- added `high_touchpoint` to `clients`
- extended client create/read/update payloads with `highTouchpoint`
- upgraded `GET /v1/operations/summary` with structured dashboard sections
- preserved backward-compatible `priorityItems` and `complianceItems`
- wired dashboard refresh on:
  - staff app boot
  - client mutations
  - scheduling mutations
  - timed dashboard refresh while visible
- rebuilt the served web bundle and refreshed `apps/web/public/index.html`

## Validation

- `node --env-file=.env apps/api/src/db/migrate.js`
- `pnpm --filter @faith/api exec node --check src/index.js`
- `pnpm lint`
- `pnpm --filter @faith/web build`
- `pnpm test:e2e`
- `pnpm test:launch-readiness`
