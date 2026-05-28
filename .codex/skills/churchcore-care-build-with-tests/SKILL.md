---
name: churchcore-care-build-with-tests
description: Use when implementing or extending ChurchCore Care features, fixing bugs, or changing behavior from Codex. Use after an approved technical brief is in hand. For full pipeline with research, story, and spec phases, use churchcore-care-feature-factory instead.
---

# ChurchCore Care Build With Tests

Use this Codex-compatible workflow for focused implementation work in ChurchCore Care.

## Required context — read before editing anything

1. `AGENTS.md` — session rules, execution checklist, delivery requirements.
2. `CLAUDE.md` — full stack, architecture rules, PHI/security constraints, testing conventions.
3. Approved technical brief or clear task description.
4. Relevant ADRs in `docs/adr/` if the change touches architecture decisions.
5. `PLANS/FULL-SECURITY-AND-AUDITING.md` if touching auth, PHI, RBAC, audit, or tenant isolation.
6. `PLANS/FULL-SURFACE-MONITORING.md` if adding or modifying a visible surface.

## Workflow

### 1. Research first

Use `rg`, `rg --files`, and parallel file reads. Do not edit yet.

- Find 2–3 existing features with a similar shape — read their services, routes, components, and tests.
- Note the patterns: naming conventions, folder structure, tenant isolation pattern, error handling, test structure.
- If anything in the brief conflicts with what you find, flag it before writing code.

### 2. Plan with `update_plan`

For multi-step work, create a concise plan with `update_plan`. Keep one item active at a time. Run write phases sequentially to avoid file conflicts.

### 3. Implement the smallest coherent slice

**Backend conventions (`apps/api/src/`)**
- Node.js ESM — `import`/`export`, never `require()`
- Business logic in `apps/api/src/lib/<name>.js` — route handlers stay thin
- PostgreSQL via `apps/api/src/db/pool.js`
- PHI encryption via `apps/api/src/lib/encrypt.js`
- Migrations in `apps/api/src/db/` — additive only, never edit merged migrations
- Worker jobs in `apps/worker/src/` — follow existing patterns for retry/backoff
- Tenant isolation check in every function that reads or writes data
- Canonical audit result values: `success`, `failure`, `denied`, `error`
- Never log PHI; never expose raw DB errors to the client

**Frontend conventions (`apps/web/src/`)**
- React 19, JSX only (`.jsx` — no TypeScript)
- Mantine v9 for all UI components — verify installed version before writing component code
- `@mantine/form` with `useForm` for forms
- `lucide-react` for icons, Tailwind v4 for utility classes
- Role gating via `apps/web/src/components/roles.js`
- Faith content gated on client's faith integration level — never hard-coded as always-visible
- New visible surfaces must be added to the monitoring registry (per `PLANS/FULL-SURFACE-MONITORING.md`)
- Never put PHI in URL params, localStorage, or console logs

### 4. Write tests alongside the code

For each logical unit:
- Write or update a unit test in `apps/api/test/*.test.mjs`
- Run `node --test test/*.test.mjs` — confirm it passes before moving on
- Cover: happy path, validation failure, not-found, tenant boundary

For UI changes:
- Add Playwright E2E tests in `tests/e2e/*.spec.mjs` for new pages or significant flows

### 5. Update documentation

For every meaningful change:
- Update `README.md` for affected sections
- Add an entry to `docs/change-log.md` (`feat:` / `fix:` format)

### 6. Verify

Run from the repo root:

```sh
pnpm lint
pnpm test
```

Both must pass before handing off. Report exact commands run and results. Do not claim completion without fresh evidence.

## ChurchCore Care hard rules

- Never skip tenant isolation — even in test or dev code.
- Never log PHI, PII, or clinical content in any form.
- Never expose raw database errors, stack traces, or internal IDs to the client.
- Never edit a DB migration that has already been merged.
- Never add a new dependency without explicit user approval.
- Never refactor code outside the agreed task scope.
- If tests cannot pass without violating a `CLAUDE.md` rule, stop and report the conflict.

## Output

End with:

- Files created or modified (with paths)
- Behavior added or changed
- Tests written and results
- Verification commands and results
- Known residual risks or pre-existing failures unrelated to this change
