# HIPAA-Ready Baseline Checklist

> **Legend:** ✅ Implemented in code · 📄 Policy documented · ⬜ Not yet started · 🔲 Partial

## Access Control

- ✅ enforce unique staff accounts with role-based authorization  
  *`apps/api/src/lib/security.js` — `enforceRbac()` middleware; enforced in main handler before every route*
- 📄 require MFA for all staff accounts  
  *`docs/security/session-policy.md` — §2; enforcement requires auth provider integration (future phase)*
- 📄 implement session timeout and re-authentication for sensitive actions  
  *`docs/security/session-policy.md` — §1, §3*
- ✅ restrict tenant access at the data layer and service layer  
  *`enforceTenantScope()` in `security.js`; applied to `handleClientById` and `handleAppointmentById`*
- ⬜ support emergency access and support impersonation only with explicit audit trails  
  *Planned: requires dedicated impersonation token flow*

## Data Protection

- ✅ encrypt data in transit with TLS  
  *HSTS header enforced (`max-age=63072000; includeSubDomains; preload`) in both API and web responses*
- ⬜ encrypt data at rest for database and object storage  
  *Current store is in-memory; required before any persistent storage is introduced*
- ✅ avoid PHI in log messages, URLs, storage object keys, and analytics payloads  
  *`emitAudit()` logs only IDs and action names — no PHI field values*
- ⬜ version signed or locked records instead of overwriting them  
  *Planned: event-sourcing or optimistic-lock versioning*
- ⬜ maintain document access history for upload, read, export, and delete events  
  *Documents module not yet built*

## Audit and Monitoring

- ✅ write immutable audit events for create, view, update, export, sign, and delete actions on PHI-sensitive records  
  *`emitAudit()` called in all client and appointment read/write handlers (see `apps/api/src/index.js`); emits structured `[AUDIT]` JSON to stdout*
- ⬜ centralize audit retention and searchability  
  *Stdout-only today; requires log aggregation pipeline (e.g., CloudWatch, Elastic)*
- ⬜ alert on abnormal access patterns, failed MFA, and privileged actions  
  *Rate-limit 429 events logged; full alerting requires external SIEM*
- ✅ separate operational telemetry from PHI-bearing application data where possible  
  *Telemetry package (`packages/telemetry`) records only counters and latencies — no PHI*

## Availability and Recovery

- ⬜ define backup frequency for database and documents  
  *In-memory store only; required before persistence layer*
- ⬜ test restore procedures on a regular cadence  
  *Blocked on persistence layer*
- ✅ isolate environments and production secrets  
  *`.env.example` documents all required vars; no secrets committed to source control*
- ⬜ define breach-response and incident escalation hooks  
  *`docs/security/session-policy.md` §8 covers session compromise; broader IR plan needed*
- ⬜ document retention, legal hold, and purge policies  
  *Planned legal/compliance documentation*

## Application Design Controls

- ✅ apply minimum necessary access rules for schedulers, billers, and interns  
  *`enforceRbac()` defines `ADMIN_ONLY_ROUTES` and `WRITE_ROLES`; read-only role can list but not mutate*
- ⬜ isolate client portal from internal staff chart views  
  *Single-role UI today; portal isolation is a future phase*
- ⬜ require explicit publishing of any document or resource to the portal  
  *Documents module not yet built*
- ✅ validate location and counselor scope on scheduling and chart access  
  *`enforceTenantScope()` blocks cross-tenant access; location validated as free-text field with length cap*
- ✅ record correction history for clinical notes and consents  
  *`emitAudit()` records `client.update` and `appointment.update` with actor and timestamp; full diff log is a future enhancement*

## Input Validation Controls

- ✅ strip null bytes and ASCII control characters from all string inputs  
  *`sanitizeStr()` in `apps/api/src/index.js` applied to all user-supplied string fields*
- ✅ enforce maximum field lengths (200 chars for names, 500 for free-text fields)  
  *`sanitizeStr(value, maxLen)` enforced in all client and appointment create/update handlers*
- ✅ reject payloads exceeding 1 MB  
  *`readRequestBody()` in both API and web servers destroys connection above 1 MB*
- ✅ validate and normalize date/time inputs  
  *`normalizeIsoDate()` rejects non-parseable dates*
- ✅ validate status enums against allow-lists  
  *`normalizeClientStatus()` and `normalizeAppointmentStatus()` return null for unknown values*

## Network Security Controls

- ✅ enforce CORS origin allow-list  
  *`handleCors()` in `security.js`; configured via `ALLOWED_ORIGINS` env var*
- ✅ apply HTTP security headers on all responses (CSP, HSTS, X-Frame-Options, etc.)  
  *`SECURITY_HEADERS` in `security.js` applied to API; `WEB_SECURITY_HEADERS` in `server.js` applied to web*
- ✅ rate-limit per client IP (sliding window, configurable via `RATE_LIMIT_MAX`)  
  *`checkRateLimit()` in `security.js`; returns 429 with `retry-after` header*
- ✅ forward authentication context headers through the web proxy  
  *`proxyApiRequest()` in `apps/web/server.js` forwards `x-staff-role`, `x-tenant-id`, `x-actor-id`, `x-request-id`*

## Operational Readiness Gates

- ⬜ permissions matrix reviewed before production onboarding
- ⬜ backup and restore drill completed
- ⬜ audit review workflow defined
- ⬜ support access workflow defined
- ⬜ security review completed before launch

