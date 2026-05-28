## What changed

<!-- A specific description of the change. Not "updated the UI" — describe what screen, what behavior, what file, what API. -->

## Why it changed

<!-- The motivation. What problem does this solve? What user, clinical, or operational need drove it? If it references an issue, link it. -->

## Plan alignment

<!-- Which PLANS/ or docs/ section does this work belong to? -->
- Relevant plan document(s):
- Why this work belongs there:

## Validation performed

<!-- List what you tested. Be specific. -->
- [ ] `pnpm lint` — passed
- [ ] `pnpm test` — passed
- [ ] Manual steps performed: _(describe what you clicked, what you observed)_
- [ ] Browser sweep result (required for UI changes): `publicErrors: 0, adminErrors: 0, clientErrors: 0`
- [ ] Security regression: `pnpm test:security` — _(passed / not applicable)_

## Checklist

- [ ] Feature branch — not pushing directly to `main`
- [ ] `README.md` updated for affected sections
- [ ] `docs/change-log.md` updated with a `feat:` / `fix:` / `release:` entry
- [ ] Docs in `docs/` updated if behavior changed
- [ ] Screenshots attached for any UI changes
- [ ] New visible surfaces added to the monitoring surface registry (per `PLANS/FULL-SURFACE-MONITORING.md`)
- [ ] PHI, clinical data, auth, RBAC, or audit impact reviewed (per `PLANS/FULL-SECURITY-AND-AUDITING.md`)
- [ ] No PHI in logs, metrics, audit labels, or monitoring payloads
- [ ] No new DB migrations edited after prior merge
- [ ] No new dependencies added without discussion

## Security and compliance notes

<!-- Required if this PR touches auth, sessions, RBAC, PHI, audit, exports, tenant isolation, or background jobs. -->
- PHI fields involved and how they are handled:
- Audit events emitted (use `success` / `failure` / `denied` / `error`):
- Tenant isolation verified:

## AI factory notes _(if this PR was built using the factory pipeline)_

- [ ] `@codebase-researcher` map was reviewed and confirmed correct
- [ ] User story was approved before implementation started
- [ ] Technical brief was approved before implementation started
- [ ] `@implementation-validator` report reviewed — no BLOCKERs
- Validator summary: _(paste the one-line result here)_

## Follow-up actions

<!-- Anything a maintainer needs to do after merge: run migrations, set env vars, update config, notify team. -->

## ADR

<!-- Was an Architecture Decision Record created or updated? If yes, link it. If no, explain why one wasn't needed. -->
- ADR needed / updated:
