# ADR 0009: In-App Analytics Without a Third-Party BI Tool

## Status

Accepted

## Context

Practice administrators need session volume, revenue, no-show rate, and outcome trend data
to run their practice. This is a table-stakes feature for replacing SimplePractice, which
provides basic session and revenue reporting.

Three approaches were evaluated:

**Option A — Embedded third-party BI (Metabase, Redash, Grafana)**  
Powerful and flexible but introduces a separate infrastructure dependency, a second auth
boundary, and a PHI-exposure risk if the BI tool is not HIPAA-configured. Metabase Cloud
requires a BAA; self-hosted adds operational overhead. Overkill for v1 reporting needs.

**Option B — In-app analytics served from the existing PostgreSQL + API**  
Aggregate queries run directly against the tenant DB via the existing API. The API already
enforces tenant isolation and RBAC. Reports are React components using `@mantine/charts`
(already in the stack). No new infrastructure, no new auth boundary, no PHI exposure to
third-party systems.

**Option C — Event streaming to a data warehouse (BigQuery, Snowflake)**  
Correct long-term architecture but requires an event pipeline, schema design, and warehouse
infrastructure. Months of work for benefits that a small practice won't use in year one.

## Decision

Use **Option B**: in-app analytics built on the existing API and PostgreSQL.

Rationale:
- Tenant isolation and PHI protection are already enforced at the API layer; no new surface
- `@mantine/charts` is already bundled (added with Mantine v9 migration); no new dependency
- Aggregate queries on the tenant DB are fast enough for practice-scale data (< 10K sessions/year for a typical practice)
- No third-party BAA required; HIPAA posture unchanged
- Can be promoted to Option C later by replacing the SQL queries with warehouse reads — the API contract stays the same

Aggregate queries must not return raw PHI in any field. Reports return counts, sums, and
date-bucketed totals only. Client names never appear in report responses.

## Consequences

### Positive

- Zero new infrastructure
- Tenant isolation inherited from existing middleware
- No third-party BAA negotiation
- `@mantine/charts` AreaChart, LineChart, BarChart components available immediately

### Negative

- Complex cross-counselor queries may need careful indexing on `scheduled_at`, `counselor_id`, `tenant_id`
- No ad-hoc query capability for admins (fixed report set only in v1)
- Multi-tenant platform-level analytics (across all tenants) are not supported by this approach — those belong in the platform admin console with a separate query path

### Mitigation

- Add indexes in migrations alongside analytics queries (not as separate migrations)
- Document the fixed report set clearly; treat new report requests as new stories
- Platform-level analytics are the platform console's responsibility (out of scope here)

## References

- `PLANS/PHASE-C-F-COMPETITIVE-PARITY.md` Phase D
- `@mantine/charts` documentation
- `apps/api/src/middleware/` for existing RBAC patterns
