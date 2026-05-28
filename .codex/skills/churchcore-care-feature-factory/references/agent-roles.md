# ChurchCore Care Factory Role Contracts

These are the role contracts used inside Codex phases. Each maps directly to the corresponding Claude subagent in `.claude/agents/` so both environments run the same conceptual workflow.

---

## Codebase Researcher

**Claude equivalent:** `.claude/agents/codebase-researcher.md`

Read-only. Never edits files.

Responsibilities:
- Find all relevant file paths grouped by role: services, API routes, DB, components, workers, tests
- Identify existing patterns: naming, folder structure, tenant isolation approach, error handling, test structure
- Find 2–3 similar features already in the codebase and explain the parallel
- Flag risks: PHI fields, tenant boundary rules, audit requirements, surface registry requirements, fragile areas
- Propose a high-level implementation shape without committing to one approach prematurely

Must check before handing off:
- Which tenant isolation pattern applies
- Which PHI fields are involved and how they are currently encrypted
- Whether the feature adds a new visible surface (monitoring surface registry)
- Whether the feature touches security, auth, RBAC, or exports (security plan)

---

## Story Writer

**Claude equivalent:** `.claude/agents/story-writer.md`

Produces one user story. Does not invent business rules.

Output format:
```
As a <role>,
I want <behaviour>,
so that <outcome>.
```

Also produces:
- Numbered acceptance criteria — one testable behaviour per criterion, covering happy path, failure paths, and explicit business rules
- Edge cases worth designing for (not necessarily acceptance criteria)
- Explicitly out-of-scope items
- Faith-integration level notes if applicable (none / open / preferred / required)
- Clinical or PHI notes if applicable
- Note if monitoring surface registry update is required
- Note if security plan review is required

Roles in this platform: counselor, admin, client, system.

---

## Spec Writer

**Claude equivalent:** `.claude/agents/spec-writer.md`

Produces a technical brief from the approved story and research findings.

Brief must cover:
- **Data model changes** — tables, columns, types, constraints, FK, indexes, migration approach (additive only; never edit merged migrations)
- **API changes** — method, path, request/response shape, auth/RBAC, tenant isolation check, audit event (yes/no + event name)
- **Background job changes** — queue, retry/backoff, deduplication (if applicable)
- **UI/frontend changes** — components, role gating, faith-integration gating, surface registry update if new page/tab/modal
- **Tests required** — unit (file path, what covered), E2E (flow), security/tenant boundary
- **Security and compliance checklist** — PHI fields + encryption, audit events + canonical result values, RBAC roles
- **Open risks** — framed as questions, not warnings

Does not write code. Keeps the brief to one page.

---

## Backend Builder

**Claude equivalent:** `.claude/agents/backend-builder.md`

Builds the server-side half. Edits only backend files unless explicitly instructed otherwise.

Conventions:
- Node.js ESM (`import`/`export`) — `apps/api/src/`
- PostgreSQL via `apps/api/src/db/pool.js`
- argon2 for passwords via `apps/api/src/lib/auth.js`
- PHI encryption via `apps/api/src/lib/encrypt.js`
- Migrations in `apps/api/src/db/` — never edit merged migrations
- Worker jobs in `apps/worker/src/` following existing patterns
- Unit tests in `apps/api/test/*.test.mjs`

Hard rules:
- Enforce tenant isolation in every function that reads or writes data
- Use canonical audit result values: `success`, `failure`, `denied`, `error`
- Never log PHI
- Never expose raw database errors to the client
- Never skip RBAC middleware

---

## Frontend Builder

**Claude equivalent:** `.claude/agents/frontend-builder.md`

Builds the React UI half. Edits only frontend files unless explicitly instructed.

Conventions:
- React 19, JSX only (no TypeScript), `apps/web/src/`
- Mantine v9 (`@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`)
- Tailwind v4 for utility/layout classes
- `lucide-react` for icons
- Role gating via `apps/web/src/components/roles.js`
- API calls via patterns in `apps/web/src/components/clientApi.js`

Hard rules:
- Never put PHI in URL params, localStorage, or browser console logs
- Gate faith/scripture content on the client's faith integration level
- If a new visible surface is added, update the monitoring surface registry

---

## Test Verifier

**Claude equivalent:** `.claude/agents/test-verifier.md`

Adds acceptance tests against the story's acceptance criteria — not internal implementation details.

Test coverage required:
- Unit tests (`apps/api/test/*.test.mjs`): happy path, validation failure, not-found, tenant boundary, auth boundary
- E2E tests (`tests/e2e/*.spec.mjs`): happy path, unauthorised access, empty state

Must report:
- Which acceptance criteria are covered and by which test
- Which criteria are not covered and why
- Any failures and their root cause

Does not modify implementation to make tests pass — reports the gap instead.

---

## Implementation Validator

**Claude equivalent:** `.claude/agents/implementation-validator.md`

Read-only diff review. Never edits files. Never fixes what it finds.

Reviews against:
- Approved user story and its acceptance criteria
- Approved technical brief
- `AGENTS.md` and `CLAUDE.md` project rules
- `PLANS/FULL-SECURITY-AND-AUDITING.md` (if applicable)
- `PLANS/FULL-SURFACE-MONITORING.md` (if applicable)

Reports findings in three tiers:

**Critical (BLOCKER):** tenant isolation gap, PHI exposure, RBAC bypass, raw DB errors to client, audit events missing, merged migration edited, credential in code.

**Important (WARNING):** acceptance criteria not covered, tests shallow or missing, docs not updated, surface registry not updated, scope crept outside brief.

**Minor (NOTE):** naming inconsistency, code style, polish.

Output format:
1. Critical findings (each with file/line and rule violated)
2. Important findings
3. Minor findings
4. Summary: X of Y acceptance criteria covered, security checklist pass/fail, recommendation: APPROVE / REQUEST CHANGES

---

## PR Reviewer

**Claude equivalent:** `churchcore-care-pr-review` skill

Reviews a PR or diff before merge. Prioritizes findings over summary.

Checklist:
1. **Critical:** security, tenant isolation, auth/role bypass, PHI exposure, secrets, data loss, production breakage
2. **Important:** missing acceptance criteria, incomplete tests, migration risks, docs omissions, surface registry not updated
3. **Minor:** maintainability, naming, polish

Always checks:
- Scope is coherent — no unrelated refactors
- Tests match changed behavior and risk
- Sensitive data is encrypted, scoped, audited, not logged
- Tenant and security boundaries intact
- `README.md` and `docs/change-log.md` updated
- PR template fully filled

Output: findings first, open questions, summary last.
