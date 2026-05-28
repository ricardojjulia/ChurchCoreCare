---
name: build-with-tests
description: Use when implementing a feature or extending existing behaviour. Reads CLAUDE.md and the technical brief, matches existing patterns, writes production code with unit tests alongside it, and runs the project's validation commands. Triggers on: build, implement, add, extend, ship the feature, write the code for.
---

## Process

1. **Orient** — Read `CLAUDE.md`. Understand the stack, architecture rules, and tenant isolation requirements before writing anything.

2. **Read the brief** — Read the technical brief or feature description. Understand the full scope before touching a file. If the brief is missing or vague, stop and ask.

3. **Find the patterns** — Read 2–3 existing features that are similar in shape. Note their file layout, naming conventions, error handling, tenant isolation pattern, and test structure. Copy these patterns — do not invent new ones.

4. **Implement in steps** — For each logical unit of work:
   - Write the production code.
   - Write a unit test that covers the new behaviour.
   - Run the test (`node --test test/*.test.mjs`) and confirm it passes before moving to the next step.

5. **Validate** — When the feature is complete, run all three checks from the repo root:
   ```sh
   pnpm lint
   pnpm test
   ```
   Fix every failure before finishing. Do not skip or suppress.

6. **Report** — Return a short summary:
   - Files created or modified (with paths)
   - Test coverage (which acceptance criteria are covered)
   - Patterns reused from the codebase
   - Any rule you would suggest adding to `CLAUDE.md` based on something you had to figure out

## Conventions for this project

**File placement**
- API services → `apps/api/src/lib/<name>.js`
- API routes → registered in `apps/api/src/index.js`
- DB migrations → `apps/api/src/db/migrate-NNNN-description.js`
- Worker jobs → `apps/worker/src/<name>.js`
- React components → `apps/web/src/components/<Area>/<Name>.jsx`
- Unit tests → `apps/api/test/<name>.test.mjs`
- E2E tests → `tests/e2e/<name>.spec.mjs`

**Code conventions**
- Node.js ESM — use `import`/`export`, never `require()`
- Mantine v9 for all React UI — not v7/v8 patterns
- `@mantine/form` for forms
- `lucide-react` for icons
- No TypeScript — `.jsx` and `.js` only
- Thin route handlers — call into service modules
- Tenant isolation check in every service function that reads or writes data
- PHI encryption via `apps/api/src/lib/encrypt.js`
- Audit events logged with: `success`, `failure`, `denied`, `error`

**Test conventions**
- Node.js built-in test runner
- One test file per service/module
- Cover: happy path, validation failure, not-found, tenant boundary
- Do not mock the database unless existing tests already do
- Use real test data patterns from `apps/api/test/`

## Rules

- Do not refactor unrelated code.
- Do not change files outside the brief's scope.
- Do not add new dependencies without explicit user approval.
- Do not edit merged DB migrations.
- If tests cannot pass without violating a CLAUDE.md rule, stop and report the conflict rather than violating the rule.
