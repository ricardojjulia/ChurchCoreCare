# AGENTS

You are working in the ChurchCore Care repository — a faith-based Christian counseling practice platform. Follow these rules exactly before making changes.

This repository uses `main` as the monitoring and runtime-health baseline.

For any work touching UI, monitoring, health, screens, tabs, workflows, dashboards, runtime visibility, or summaries:

- Read [PLANS/FULL-SURFACE-MONITORING.md](PLANS/FULL-SURFACE-MONITORING.md) first.
- Treat that file as the source of truth.

For any work touching security, auditing, compliance, PHI handling, RBAC, auth/session behavior, tenant isolation, exports, retention, impersonation, background jobs, or system automation:

- Read [PLANS/FULL-SECURITY-AND-AUDITING.md](PLANS/FULL-SECURITY-AND-AUDITING.md) first.
- Treat that file as the source of truth.

Required repo rules:

- Every visible surface must preserve local monitoring visibility for health, reliability, errors, and workflow consistency.
- New or modified screens, tabs, pages, and major modal workflows must be added to the shared surface registry.
- New or modified visible surfaces must appear in the monitoring summary.
- New or modified visible surfaces must be represented on the monitoring page.
- Local monitoring must remain available without OTEL / OTLP exporters or external observability collectors.
- Do not reintroduce browser telemetry beacons, OTEL exporters, or collector dependencies unless the monitoring plan is updated first.
- Never emit PHI, free text, names, emails, IDs, or other high-cardinality labels in monitoring-related diagnostics.
- Placeholder but visible screens still require baseline monitoring coverage.
- Audit ledger and monitoring must remain separate systems: never export raw audit rows through monitoring flows.
- Security and auditing changes must follow canonical audit result semantics (`success`, `failure`, `denied`, `error`).

Documentation rules:

- If a session changes the monitoring standard, update `PLANS/FULL-SURFACE-MONITORING.md` first.
- If a session changes the security or auditing standard, update `PLANS/FULL-SECURITY-AND-AUDITING.md` first.
- If a session changes user-visible monitoring behavior, also update the relevant README and documentation entries.
- If a session changes user-visible security or auditing behavior, also update the relevant README and documentation entries.

Relationship of the two files:

- `PLANS/FULL-SURFACE-MONITORING.md` is the detailed canonical implementation spec.
- `PLANS/FULL-SECURITY-AND-AUDITING.md` is the detailed canonical implementation spec for security and auditing.
- `AGENTS.md` is the durable session-level instruction layer and defers to the canonical plan files when details are needed.

---

## Git and collaboration rules

- Do not push directly to main.
- Always create a feature branch first.
- Open a pull request into main.
- Keep commits focused and small.
- Use signed commits.
- Never use destructive git commands unless explicitly requested by the user.

## Local workflow guardrails

Startup policy for all humans and agents:

- Use `/Users/rjulia/ChurchCoreCare` as the current SaaS runtime workspace.
- Use `pnpm start` from the repo root as the canonical local startup command.
- Do not use `node start-servers.js` for standard development runs.
- `pnpm start` is responsible for env loading, online Supabase readiness checks, migrations, and starting API+web.
- Application runtime is Supabase-only. Do not start or fall back to a local database.
- Local and loopback database hosts are permitted only in disposable automated test fixtures with `CHURCHCORE_ALLOW_TEST_DATABASE=true`.
- Follow [`docs/runbooks/saas-runtime.md`](docs/runbooks/saas-runtime.md) for checkout, startup, verification, and recovery.

A shared pre-push hook exists at `.githooks/pre-push`. Enable it in your clone:

```sh
git config core.hooksPath .githooks
```

This hook blocks direct pushes to main and master.

## Repository policy context

- Main branch protections and ruleset behavior are active.
- Signed commits are required.
- Branch + PR workflow is expected.

---

## Commit documentation requirements

Every commit must update the following, with no exceptions:

- **`README.md`** — update any sections affected by the change (features, setup steps, known issues, etc.).
- **`docs/change-log.md`** — add an entry for the change. Entry format depends on the commit type:

  | Commit type | Entry format |
  | --- | --- |
  | Bug fix / error | `### fix: <short description>` with date, affected area, and what was corrected |
  | Feature / enhancement | `### feat: <short description>` with date and summary |
  | Major revision / release | `### release: vX.Y.Z — <title>` with date and summary; **also** create a release summary file (see below) |

- **Release summary file** — required for any major revision or version bump. Create `docs/vX.Y.Z-RELEASE-SUMMARY.md` following the naming convention of existing release files in `docs/`. The file must include: version, date, summary of changes, migration steps if any, and known issues.

These documentation updates must be part of the same commit as the code change. Do not defer them to a follow-up commit.

---

## AI development factory

This repository ships a software factory for both Claude Code and Codex. Both environments run the same seven-phase workflow — the tools and invocation syntax differ, the discipline does not. Read `CLAUDE.md` for the full stack and architecture context.

### Claude Code factory (`.claude/`)

The factory for Claude Code lives in `.claude/` and uses separate agent files that each run in their own context window:

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | Project knowledge loaded into every session automatically |
| `.claude/agents/codebase-researcher.md` | Read-only codebase mapper — always the first step |
| `.claude/agents/story-writer.md` | Rough idea → user story with acceptance criteria |
| `.claude/agents/spec-writer.md` | Approved story → technical brief |
| `.claude/agents/backend-builder.md` | Services, API routes, DB migrations, jobs, unit tests |
| `.claude/agents/frontend-builder.md` | React components, pages, forms, UI tests |
| `.claude/agents/test-verifier.md` | Acceptance tests against the user story |
| `.claude/agents/implementation-validator.md` | Independent pre-PR audit (read-only) |
| `.claude/skills/build-with-tests/SKILL.md` | Single-agent feature build with tests |
| `.claude/skills/orchestrate-feature/SKILL.md` | Full pipeline orchestrator with three human approval gates |
| `.claude/hooks/pre-commit.sh` | Blocks credential/key/env files from being committed |

#### How to invoke (Claude Code)

**Full pipeline** (research → story → spec → build → test → validate):

```text
Use the orchestrate-feature skill to build [describe the feature].
```

**Quick build** (you already have a brief):

```text
Use the build-with-tests skill to implement [describe the feature].
```

**Individual agents** at any step:

```text
@codebase-researcher — how does [area] work today?
@implementation-validator — review this before I open a PR
```

### Codex factory (`.codex/`)

The factory for Codex lives in `.codex/skills/` and maps the same seven roles into sequential Codex work phases:

| Skill | Purpose |
| --- | --- |
| `.codex/skills/churchcore-care-feature-factory/SKILL.md` | Full pipeline — research through validation, with three approval gates |
| `.codex/skills/churchcore-care-feature-factory/references/agent-roles.md` | Role contracts referenced by the factory |
| `.codex/skills/churchcore-care-build-with-tests/SKILL.md` | Focused implementation when a brief is already approved |
| `.codex/skills/churchcore-care-pr-review/SKILL.md` | PR and diff review before merge or handoff |

#### How to invoke (Codex)

**Full pipeline:**

```text
Use the churchcore-care-feature-factory skill to build [describe the feature].
```

**Implementation only (brief already approved):**

```text
Use the churchcore-care-build-with-tests skill to implement [describe the feature].
```

**PR review:**

```text
Use the churchcore-care-pr-review skill to review this PR / diff.
```

### Factory alignment rule

Both factories run the same phases and enforce the same rules. The role contracts in `.codex/skills/churchcore-care-feature-factory/references/agent-roles.md` are the shared reference. If a rule changes (e.g., a new PHI convention, a new required audit event), update `CLAUDE.md` first, then update the Codex role contracts to match.

### Factory rules for agents

- `@codebase-researcher` is always invoked before any implementation. Never build without a codebase map.
- The user story must be explicitly approved before the spec is written.
- The technical brief must be explicitly approved before code is written.
- `@implementation-validator` must run before any PR is opened. No BLOCKERs may be present.
- `@implementation-validator` is read-only — it never fixes what it finds.
- All factory outputs must still satisfy the project rules in this file and in the two canonical plan files.

---

## Required execution checklist for every task

1. Read `AGENTS.md` (this file).
2. Read `CLAUDE.md` — project stack, architecture rules, and conventions.
3. Confirm task scope — identify whether monitoring or security plans apply.
4. For non-trivial features, run the factory pipeline (`orchestrate-feature` skill).
5. Make changes on a new feature branch.
6. Run `pnpm lint` and `pnpm test` — both must pass.
7. Update `README.md` and `docs/change-log.md` (and create a release summary if applicable).
8. Commit with a signed commit.
9. Push branch and open a PR using `.github/pull_request_template.md` — fill every section.

## Pull request expectations

Every PR must fill all sections of `.github/pull_request_template.md`:

- **What changed** — specific description (screen, behavior, file, API).
- **Why it changed** — motivation and user/clinical/operational need.
- **Plan alignment** — which PLANS/ section this belongs to.
- **Validation performed** — lint, test, manual checks, browser sweep result.
- **Security and compliance notes** — PHI, audit, tenant isolation.
- **AI factory notes** — if built with the factory, confirm validator was run.
- **Follow-up actions** — anything maintainers need to do after merge.
