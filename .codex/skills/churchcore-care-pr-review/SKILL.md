---
name: churchcore-care-pr-review
description: Use when reviewing ChurchCore Care diffs, commits, or PRs in Codex before merge, handoff, or release. Produces findings first, then open questions, then summary. Also maps to the implementation-validator role in the factory pipeline.
---

# ChurchCore Care PR Review

Use a code-review stance. Findings come first. Summary comes last.

## Read before reviewing

1. `AGENTS.md` — project rules and delivery requirements.
2. `CLAUDE.md` — stack, architecture, PHI/security rules, testing conventions.
3. The approved user story and technical brief (if this PR was factory-built).
4. The current diff or PR context.
5. `PLANS/FULL-SECURITY-AND-AUDITING.md` if the PR touches auth, PHI, RBAC, audit, or tenant isolation.
6. `PLANS/FULL-SURFACE-MONITORING.md` if the PR adds or modifies visible surfaces.

## Review checklist

Prioritize in this order:

### 1. Critical (BLOCKER — must fix before merge)

- **Tenant isolation** — does any service function read or write data without a tenant check?
- **PHI exposure** — is PHI logged, returned in API responses, or placed in URL params, localStorage, or monitoring labels?
- **RBAC bypass** — does any route skip auth or role middleware?
- **Audit trail gaps** — are audit events missing for operations that create, modify, or delete clinical or user data?
- **Merged migration edited** — was a migration that already merged modified?
- **Raw DB errors exposed** — does any route return stack traces or raw database error messages to the client?
- **Secrets in code** — are credentials, API keys, or tokens hardcoded anywhere?
- **PHI in test fixtures** — do any test files contain real or realistic PHI?

### 2. Important (WARNING — should fix; acceptable with documented reason)

- Missing acceptance criteria — which criteria from the story are not covered?
- Shallow or missing tests — happy path only, no tenant boundary test, no auth failure test?
- Docs omissions — is `README.md` updated? Is `docs/change-log.md` updated?
- Surface registry not updated — was a new visible page, tab, or major modal added without updating the registry?
- Scope creep — were files edited outside the agreed scope?
- New dependency added without approval.
- Faith content not gated on faith integration level.

### 3. Minor (NOTE — optional improvement)

- Naming inconsistency with existing conventions
- Missing code structure alignment with similar features
- Polish or consistency concerns
- Opportunities to reuse existing utilities

## Always check

- Scope is coherent — no unrelated refactors mixed in
- Tests match the changed behavior and cover realistic failure paths
- Sensitive data (PHI, clinical content, session tokens) is encrypted, scoped, audited, and not logged anywhere
- Tenant and security plan boundaries remain intact
- `README.md` and `docs/change-log.md` are updated for meaningful changes
- PR template (`.github/pull_request_template.md`) is fully filled — every section has content, not placeholders
- If factory-built: validator section of the PR template is filled and no BLOCKERs are listed

## Output format

Return in this order:

1. **Critical findings** — each with file path, line reference where possible, and the rule it violates
2. **Important findings** — each with file path and suggested fix direction
3. **Minor findings** — brief list only
4. **Open questions** — things that cannot be resolved from reading the diff alone
5. **Summary** — only after all findings:
   - Acceptance criteria: X of Y covered
   - Security checklist: pass / partial / fail (list any failures)
   - Surface registry: updated / not applicable / missing
   - Recommendation: **APPROVE** / **REQUEST CHANGES** (and why)

Do not praise the implementation. Focus on gaps, violations, and risks.
