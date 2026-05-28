---
name: churchcore-care-feature-factory
description: Use when building a non-trivial ChurchCore Care feature end to end in Codex. Covers product rules, architecture decisions, backend, frontend, tests, documentation, and validation. Phases map to the seven Claude agent roles so both AI environments run the same structured workflow.
---

# ChurchCore Care Feature Factory

This is the Codex-compatible version of the ChurchCore Care software factory. It maps the seven Claude subagent roles into sequential Codex work phases. The intent is identical — structured, gated, validated feature development — adapted to how Codex runs tasks.

## Role chain

Role contracts are in `references/agent-roles.md`.

1. **Researcher** — map relevant files, existing patterns, risks, PHI/tenant rules, tests.
2. **Story writer** — turn the idea into a user story with acceptance criteria.
3. **Spec writer** — produce the technical brief from the approved story.
4. **Backend builder** — implement services, API routes, DB migrations, jobs, unit tests.
5. **Frontend builder** — implement React components, pages, forms, UI tests.
6. **Test verifier** — add acceptance tests keyed to the story's criteria.
7. **Implementation validator** — read-only diff review against story, brief, and repo rules.

## Codex process

### Phase 0 — Orient

Read these before doing anything else:

1. `AGENTS.md` — session rules and project conventions.
2. `CLAUDE.md` — full stack, architecture rules, security constraints, testing conventions.
3. Relevant plan files: `PLANS/FULL-SECURITY-AND-AUDITING.md` and/or `PLANS/FULL-SURFACE-MONITORING.md` if the feature touches those areas.
4. Any relevant ADRs in `docs/adr/`.

### Phase 1 — Research (Researcher role)

Run read-only exploration. Use `rg`, `rg --files`, and parallel file reads. Do not edit anything.

Produce:
- Relevant file paths grouped by role (services, routes, DB, components, tests)
- Existing patterns to follow (naming, tenant isolation, error handling, test structure)
- 2–3 similar features already in the codebase
- Risks: PHI fields, tenant boundary rules, audit requirements, monitoring surface registry, fragile areas
- High-level implementation shape

**Gate:** Present findings. Get confirmation the map is correct before writing any story. If the user corrects anything, carry the correction into all subsequent phases.

### Phase 2 — Story (Story writer role)

Produce one user story:

```
As a <role>,
I want <behaviour>,
so that <outcome>.
```

With:
- Numbered acceptance criteria — one testable behaviour each
- Edge cases worth designing for
- Explicitly out-of-scope items
- Faith-integration level or clinical notes if applicable

**Gate:** Present the story. Wait for explicit approval. Do not proceed to Phase 3 without it.

### Phase 3 — Spec (Spec writer role)

Produce a technical brief covering:
- Data model changes (tables, columns, constraints, migration approach)
- API changes (method, path, request/response, auth/RBAC, tenant check, audit event)
- Background job changes if applicable
- UI/frontend changes (components, role gating, surface registry update if new page/tab/modal)
- Tests required (unit, E2E, security/tenant boundary)
- Security and compliance checklist (PHI fields, encryption, audit events, RBAC)
- Open risks

**Gate:** Present the brief. Wait for explicit approval. The brief is the build contract — do not write implementation code without it.

### Phase 4 — Implementation (Backend + Frontend builder roles)

Use `update_plan` to track multi-step work. Run write phases sequentially to avoid file conflicts.

**Backend first:**
- Services in `apps/api/src/lib/`
- Routes in `apps/api/src/index.js`
- Migrations in `apps/api/src/db/`
- Worker jobs in `apps/worker/src/`
- Unit tests in `apps/api/test/*.test.mjs`
- Enforce tenant isolation in every function that reads or writes data
- Use canonical audit result values: `success`, `failure`, `denied`, `error`
- Never expose raw DB errors to the client; never log PHI

**Frontend after backend is stable:**
- Components in `apps/web/src/components/`
- Use Mantine v9 — not v7/v8 patterns
- Use `@mantine/form` for forms, `lucide-react` for icons
- Gate by role using patterns in `apps/web/src/components/roles.js`
- Gate faith content on the client's faith integration level
- If new visible surface: update monitoring surface registry (per `PLANS/FULL-SURFACE-MONITORING.md`)

### Phase 5 — Tests (Test verifier role)

Add acceptance tests that cover the story's acceptance criteria — not internal implementation details.

- Unit tests: `apps/api/test/*.test.mjs` — happy path, validation failure, tenant boundary, auth boundary
- E2E tests: `tests/e2e/*.spec.mjs` — happy path, unauthorised access, empty state
- Run `node --test test/*.test.mjs` from `apps/api/` — all must pass

### Phase 6 — Validate (Implementation validator role)

Review the diff read-only against the approved story and brief. Report:

- **Critical** — security gaps, tenant isolation failures, PHI exposure, RBAC bypass, audit events missing, BLOCKERs
- **Important** — missing acceptance criteria, shallow tests, docs omissions, surface registry not updated
- **Minor** — naming, polish, consistency

Do not edit files during this phase. Report only.

**Gate:** If Critical findings exist, stop and report them. Do not open a PR with Critical findings unresolved.

### Phase 7 — Verify and close

Run from the repo root:

```sh
pnpm lint
pnpm test
```

Both must pass. Then:

- Confirm `README.md` is updated for affected sections
- Confirm `docs/change-log.md` has a `feat:` or `fix:` entry
- Confirm new visible surfaces are in the monitoring registry if applicable

## Stop conditions

- Missing business rule that changes data model, RBAC, PHI handling, or tenant boundaries.
- Implementation would require adding a dependency — get approval first.
- Tests or lint fail for reasons that cannot be isolated from the change.
- A Critical finding from the validator has no agreed resolution.

## Output

End every factory run with:

- Files created or modified (with paths)
- Behavior added or changed
- Acceptance criteria covered (map criterion → test)
- Verification commands run and results
- Known residual risks or pre-existing failures unrelated to this change
