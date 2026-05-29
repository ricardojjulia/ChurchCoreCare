# ADR 0010: Group and Family Therapy Data Model

## Status

Accepted

## Context

Church counseling centers run group therapy programs and couples/family counseling as core
offerings — not edge cases. The current data model assumes a 1:1 counselor-to-client
session relationship. Extending it to handle groups and relational units requires a clear
data model decision before any code is written.

Two design choices had meaningful tradeoffs:

**1. Shared session table vs. separate group_sessions table**

Option A — Extend the existing `sessions` table with a nullable `group_id` column.  
One table for all sessions. Simple queries for schedule views. Risk: the 1:1 assumption
is baked into many existing session queries (billing, notes, audit). Adding nullable group
context to a heavily-joined table creates ambiguity and risks breaking existing queries.

Option B — Separate `group_sessions` table that references a `therapy_groups` parent.  
Individual sessions and group sessions are modeled separately. Existing code is unchanged.
Group-aware queries are explicit. Billing, notes, and audit can be extended cleanly without
touching individual session logic.

**2. Individual notes within group sessions**

Option A — Store all group notes in one large JSON blob per session.  
Simple to implement; hard to enforce per-member access control and encryption.

Option B — Separate `group_session_notes` (shared) and `group_member_notes` (per-client).  
Shared note visible to all counselors in the group. Individual member notes are encrypted
per-client and only readable by counselors with access to that client. Matches the existing
PHI encryption pattern in the individual session chart.

**3. Couples / family vs. groups**

Option A — Use the same group model for couples and families.  
Couples = group with 2 members. Simpler schema. Loses semantic distinction that affects
CPT code selection (90847 vs 90853), billing, and future reporting.

Option B — Separate `relational_units` table for couples/families.  
Explicit `unit_type` (couple, family, other). CPT code mapping is unambiguous. Can share
the `group_sessions` model for scheduling and notes via a polymorphic `session_context`
approach (either `group_id` or `unit_id` is set, not both).

## Decision

- **Separate `group_sessions` table** (Option B for choice 1)
- **Split `group_session_notes` + `group_member_notes`** (Option B for choice 2)
- **Separate `relational_units` table** (Option B for choice 3)

The schema is:

```sql
-- Group programs
therapy_groups (id, tenant_id, name, counselor_id, max_members, is_active, created_at)
group_members  (id, group_id, client_id, tenant_id, joined_at, left_at)
group_sessions (id, group_id, tenant_id, scheduled_at, duration_minutes, status, created_at)
group_session_notes (id, group_session_id, tenant_id, counselor_id, shared_note_enc, created_at)
group_member_notes  (id, group_session_id, client_id, tenant_id, individual_note_enc, created_at)

-- Relational units (couples, families)
relational_units        (id, tenant_id, unit_type VARCHAR(16), label, counselor_id, created_at)
relational_unit_members (id, unit_id, client_id, tenant_id, role VARCHAR(32), joined_at, left_at)
```

Relational unit sessions reuse `group_sessions` with a nullable `unit_id` column
(either `group_id` or `unit_id` is set; a check constraint enforces exactly one).

## Consequences

### Positive

- No existing session queries are touched; rollout risk is minimal
- Per-member note encryption matches existing PHI handling pattern (`encrypt.js`)
- CPT code mapping is unambiguous: group (90853), multiple family (90849), conjoint (90847)
- `left_at` enables member removal without losing history
- Counselor-level access control on individual notes is straightforward

### Negative

- Schedule view must join across two session tables to show a counselor's full day
- Six new tables increases migration complexity
- Billing must handle per-member claim generation (one claim per client per group session)

### Mitigation

- A `v_counselor_schedule` view can union individual and group sessions for the schedule query
- Group billing wrapped in a transaction; any member claim failure rolls back the entire batch

## References

- `PLANS/PHASE-C-F-COMPETITIVE-PARITY.md` Phase F
- `apps/api/src/db/schema.sql` — existing sessions + notes tables
- `apps/api/src/lib/encrypt.js` — PHI encryption pattern
- CPT code reference: 90853 (group), 90849 (multiple family group), 90847 (family conjoint), 90846 (family without patient)
