# AI Prompt: Replicate the Demo Feedback and Error-Triage System

Use the following prompt with Codex or another coding agent inside the target
repository.

---

Implement a production-quality demo feedback and error-triage system using the
target repository's existing framework, authentication, database, component
library, tests, and documentation conventions.

## Working Method

1. Read repository instructions, architecture and security plans, auth code,
   migration conventions, and test configuration.
2. Map existing global providers, error boundaries, authenticated routes,
   privileged database access, admin workspaces, notifications, and tests.
3. Present the architecture, data flow, privacy, authorization, deduplication,
   throttling, error handling, and test plan for approval when required.
4. Use test-driven development and run focused tests before the full repository
   verification commands.
5. Update README, change log, API docs, operational docs, and surface registry.

## Required Behavior

- Gate the browser UI with a demo environment flag and independently gate the
  submission endpoint on the server.
- Keep disabled demo components inert: no rendering, listeners, storage, or
  requests.
- Maintain a browser-tab demo session UUID, start time, five recent canonical
  routes, and elapsed duration.
- Provide a fixed accessible feedback action with categories `BUG`, `ERROR`,
  `UNEXPECTED_RESULT`, and `IMPROVEMENT`; accept an optional note of at most
  2,000 characters.
- Submit only session ID, route, category, optional safe error message, optional
  note, breadcrumbs, demo version, and duration. Never trust browser identity,
  authorization, or fingerprint fields.
- Add a surface-level React error boundary that submits safe error context
  asynchronously, swallows secondary reporting failures, and preserves the
  application shell. Never submit stacks, tokens, headers, secrets, or record
  payloads.

## Server Contract

- Validate UUID session IDs, routes from 1 to 500 characters, exact categories,
  error messages up to 4,000 characters, notes up to 2,000 characters, at most
  five breadcrumbs of 500 characters each, demo versions up to 100 characters,
  and integer durations from 0 through 2,592,000 seconds.
- Reject malformed JSON and incorrect types. Return generic database failures.
- Derive authenticated email and role from the verified server session.
  Anonymous reports store null identity.
- Compute a server-side SHA-256 fingerprint after trimming, lowercasing, and
  collapsing whitespace. Automatic errors use route, category, and error
  message. Manual reports use route, category, and note.
- Store feedback in the platform/control-plane database. Encrypt report content
  at rest and prohibit direct browser-role access.
- Enforce 20 accepted submissions per session per 60-second window in durable
  shared storage. Hash session IDs for limiter keys and serialize same-key
  updates atomically.
- On fingerprint conflict, increment hit count, refresh current context, retain
  the original creation time, reopen the report, and clear its previous action.

The report model must include UUID ID, unique fingerprint, session ID, route,
constrained category, optional encrypted error and note, JSON breadcrumbs,
optional encrypted email, role, demo version, nullable non-negative duration,
hit count, JSON metadata, processed state, constrained action, and timestamps.
Supported actions are `code_fixed`, `update_applied`,
`suggestion_not_implemented`, `suggestion_implemented`, `bug_fixed`,
`error_fixed`, and `received_and_closed`.

## Staff Workspace

Add a platform-staff-only route with open, done, and all views; category,
identity, and date filters; unprocessed-first ordering; duplicate counts; and
triage controls. A detail drawer must show bounded context, full authorized
content, action selection, processed state, and collapsed diagnostic JSON.
Use optimistic updates with rollback. Protect reads and mutations with the
repository's platform authorization helper.

## Required Tests

Cover disabled-mode inertness, manual submission, automatic error capture,
ignored browser identity/fingerprints, server-derived and anonymous identity,
fingerprint normalization, distinct manual notes, every input bound, duration
round-trip, HTTP 429 and generic 500 behavior, platform-only review access,
filters and empty states, detail and triage updates, duplicate hit increments,
issue reopening, and migration-level atomic throttling where practical.

Use a feature branch, preserve unrelated changes, document migration order and
environment variables, and report verification results. Explicitly note that a
browser can rotate its generated session ID, so per-session throttling is not
complete bot protection.
