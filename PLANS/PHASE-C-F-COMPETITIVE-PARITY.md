# Phase C–F: Competitive Parity Sprint

**Status:** Phase C complete (2026-05-28) — Phase D complete (2026-05-28) — Phase E complete (2026-05-28) — Phase F complete (2026-05-28)  
**Prepared:** 2026-05-27  
**Follows:** PHASE-A-B-SAAS-LAUNCH.md (completed 2026-05-27)  
**Owners:** Product, Engineering  

---

## Strategic context

ChurchCore Care shipped a credible v1 (Phase A+B). The faith-integration angle is a genuine
differentiator, but four gaps prevent selling to established practices:

| Gap | Impact |
|---|---|
| No mobile app | Counselors document between sessions on phones; loss on every competitive eval |
| No analytics/reporting | Clinical directors won't switch platforms without session volume + outcome data |
| No ERA/payment reconciliation | Billing staff can't use an EHR that doesn't close the claim loop |
| No group/family therapy | Church counseling centers run group programs; they're the target buyer |

The client portal (self-scheduling, intake, secure messaging) was completed in March 2026
(see `CLIENT-PORTAL-EXPANSION.md`). These four phases complete competitive parity.

---

## Software factory conventions

Each item below is scoped to one factory cycle:

```
story-writer → spec-writer → codebase-researcher
  → backend-builder → frontend-builder → test-verifier → implementation-validator
```

Items are ordered by dependency. Backend items can be picked up independently of frontend.
No item should take more than one day of factory time.

---

## Phase C — Mobile PWA

**Approach:** Progressive Web App in a new `apps/mobile` Vite project.  
See `docs/adr/0008-pwa-mobile-strategy.md` for the full decision.

The mobile app is a counselor-facing companion, not a client app. It mirrors the core web
app workflows in a mobile-first shell: bottom navigation, touch-optimized forms,
offline-capable note drafting. Delivered to counselors via browser install (Add to Home
Screen) and optionally wrapped with Capacitor for App Store distribution.

### C1 — PWA scaffold

**Story:** As a counselor, I can install ChurchCore Care on my phone from my browser and
open it without a separate app store download.

**Deliverables:**
- `apps/mobile/` — new Vite + React 19 + Mantine v9 project
- `vite-plugin-pwa` for service worker and web manifest
- Bottom-tab shell: Schedule, Clients, Notes, Profile
- Auth gate: if no session → mobile login page
- `pnpm --filter @churchcore/mobile build` produces an installable PWA
- Firebase Hosting target `mobile` added to `firebase.json` and `.firebaserc`
- Deploy step added to `deploy.yml` (staging + production)

**Acceptance criteria:**
- Lighthouse PWA score ≥ 90
- App shell loads offline (empty state, not error)
- Install prompt appears on Android Chrome and iOS Safari

---

### C2 — Mobile auth

**Story:** As a counselor, I can sign in on my phone with the same credentials I use on desktop, and my session persists across app restarts.

**Deliverables:**
- Mobile login page (email + password, Mantine form)
- Session cookie stored; `httpOnly` already handled by API
- Auto-redirect to schedule on success
- Sign-out clears session

**Acceptance criteria:**
- Login → schedule redirect in < 2 seconds on 4G
- Session survives closing and reopening the app
- Invalid credentials show inline error (no alert dialogs)

---

### C3 — Today's schedule (mobile counselor dashboard)

**Story:** As a counselor, I can see today's appointments when I open the mobile app, with client name, time, and session type.

**Deliverables:**
- `GET /v1/schedule/today` API endpoint (or reuse existing schedule endpoint with today filter)
- `MobileScheduleTab.jsx` — time-ordered list of today's appointments
- Tap row → client quick view (C4)
- Pull-to-refresh
- Empty state: "No appointments today"

**Acceptance criteria:**
- Loads in < 1.5 seconds on 3G
- Shows correct appointments for the logged-in counselor only (tenant-isolated)
- Past appointments greyed out, current/next highlighted

---

### C4 — Client quick search + profile view

**Story:** As a counselor on my phone, I can search for a client by name and view their key details without opening the full desktop chart.

**Deliverables:**
- `MobileClientsTab.jsx` — debounced search input, result list
- `MobileClientCard.jsx` — name, DOB, next appointment, assigned counselor, contact
- Tap "Open in browser" → deep link to full web chart
- No PHI cached in service worker (manifest excludes `/api/` paths)

**Acceptance criteria:**
- Search results appear within 300ms of stopping typing
- Tenant isolation enforced — counselor only sees their own clients unless admin
- PHI does not appear in browser cache/offline storage

---

### C5 — Quick session note entry

**Story:** As a counselor, I can draft a quick SOAP note on my phone immediately after a session, before I forget the details.

**Deliverables:**
- `MobileNotesTab.jsx` — client picker → format picker → textarea
- Submits `POST /v1/clients/:id/progress-notes` (existing endpoint)
- Auto-saves draft to `localStorage` every 10 seconds (key: `note-draft-${clientId}`)
- Discards draft on successful submit
- Character counter (max 5000)

**Acceptance criteria:**
- Draft survives accidental tab close and browser crash
- Submitted note appears in desktop chart within 5 seconds
- AI draft generation (B1) reachable from mobile note form

---

### C6 — Push notifications

**Story:** As a counselor, I receive a push notification 15 minutes before each appointment.

**Deliverables:**
- Web Push API integration (VAPID key pair generated, stored in Secret Manager)
- `POST /v1/notifications/subscribe` — stores push subscription in `push_subscriptions` table
- DB migration: `push_subscriptions (id, staff_account_id, tenant_id, endpoint, p256dh, auth, created_at)`
- Worker job: `apps/worker/src/push-notifications.js` — fires 15-min-before reminders
- Permission request on first mobile app open (with opt-out)
- Environment variable: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

**Acceptance criteria:**
- Notification arrives within 60 seconds of the 15-minute window
- Tapping notification opens the app to that appointment
- Worker handles push endpoint expiry (unsubscribes stale endpoints)

---

### C7 — Capacitor app store wrapper (optional, Phase 2)

**Story:** As an administrator, I can distribute ChurchCore Care to counselors via the App Store and Google Play without requiring browser install.

**Deliverables:**
- `capacitor.config.json` at repo root
- `apps/mobile/android/` and `apps/mobile/ios/` Capacitor projects (gitignored build artifacts)
- `scripts/build-native.sh` — wraps Vite build + `npx cap sync`
- GitHub Actions job: `build-native` (manual trigger only, `workflow_dispatch`)
- Capacitor plugins: `@capacitor/push-notifications` (replaces Web Push on native)

**Note:** App Store submission requires Apple Developer ($99/yr) and Google Play ($25 one-time) accounts. This item produces a submittable build; store submission is an admin task.

---

## Phase D — Analytics & Reporting

**Approach:** In-app analytics served from the existing API. No third-party BI tool.  
See `docs/adr/0009-in-app-analytics.md`.

### D1 — Analytics API

**Story:** As a practice administrator, I can fetch session volume, revenue, and no-show statistics for any date range via the API.

**Deliverables:**
- `apps/api/src/lib/analytics.js` — query functions:
  - `getSessionVolume({ tenantId, from, to, counselorId? })`
  - `getRevenueStats({ tenantId, from, to })`
  - `getNoShowRate({ tenantId, from, to })`
  - `getOutcomeTrends({ tenantId, clientId?, formKey, from, to })`
- Routes:
  - `GET /v1/reports/sessions` — session volume by day/week
  - `GET /v1/reports/revenue` — billed, collected, outstanding
  - `GET /v1/reports/outcomes` — PHQ-9/GAD-7 trend aggregates
- Role gate: `admin` only
- Tenant isolation enforced on all queries

**Acceptance criteria:**
- All queries return in < 500ms for 12-month ranges (indexed properly)
- No PHI in aggregate responses (counts only, no names)
- Auth boundary: 401 if unauthenticated, 403 if non-admin

---

### D2 — Practice analytics dashboard

**Story:** As a practice administrator, I can view a dashboard showing this week's sessions, YTD revenue, and outstanding claims in a single screen.

**Deliverables:**
- `apps/web/src/components/Analytics/AnalyticsDashboard.jsx`
- `apps/web/src/components/Analytics/StatCard.jsx` — metric + trend arrow
- `apps/web/src/components/Analytics/SessionVolumeChart.jsx` — Mantine `AreaChart` (from `@mantine/charts`)
- `apps/web/src/lib/useAnalytics.js` — hooks for each report endpoint
- Route added to main nav (admin role only)
- Surface registered in monitoring registry (`PLANS/FULL-SURFACE-MONITORING.md`)

**Acceptance criteria:**
- Dashboard loads within 2 seconds
- Date range picker (this week / this month / last 3 months / custom)
- Correctly shows $0 / 0 sessions for new tenants (no empty-state crash)

---

### D3 — Outcome tracking (PHQ-9 / GAD-7 trends)

**Story:** As a counselor, I can see a client's PHQ-9 score over time as a chart, so I can discuss progress in sessions.

**Deliverables:**
- `apps/web/src/components/ClinicalChart/OutcomeTrendChart.jsx`
  - Line chart of scores over submission dates
  - Colour bands: minimal / mild / moderate / severe
  - Renders inside client chart (new "Outcomes" tab or existing Assessment tab)
- API reuses `GET /v1/reports/outcomes?clientId=...`
- Counselor role can access (not admin-only)

**Acceptance criteria:**
- Chart renders with ≥ 2 data points; single-point shows marker + label
- Correct band boundaries for PHQ-9 (0-4 minimal, 5-9 mild, 10-14 moderate, 15+ severe)
- Empty state if no PHQ-9 submissions for client

---

### D4 — Counselor productivity report

**Story:** As a practice administrator, I can see each counselor's session count, average session duration, and no-show rate for the current month.

**Deliverables:**
- `apps/api/src/lib/analytics.js` — `getCounselorProductivity({ tenantId, from, to })`
- `GET /v1/reports/counselors` — returns array of per-counselor stats
- `apps/web/src/components/Analytics/CounselorProductivityTable.jsx`
  - Sortable by sessions, no-shows, revenue
  - Linked from AnalyticsDashboard

**Acceptance criteria:**
- Admin-only; 403 for non-admin
- Correctly aggregates across all counselors in the practice

---

### D5 — Export (CSV / PDF)

**Story:** As a practice administrator, I can download session and revenue reports as a CSV for my accountant.

**Deliverables:**
- `GET /v1/reports/sessions/export?format=csv&from=...&to=...`
- `GET /v1/reports/revenue/export?format=csv`
- CSV generated server-side (no client-side library)
- "Download CSV" button in AnalyticsDashboard
- Audit event on every export: `reports.export.downloaded`

**Acceptance criteria:**
- CSV is valid (parseable by Excel / Numbers)
- No PHI beyond what the admin role is already permitted to see
- Audit event recorded on every download

---

## Phase E — Billing Reconciliation

### E1 — ERA parsing

**Story:** As a billing coordinator, the system automatically parses Electronic Remittance Advices from Stedi and matches them to submitted claims.

**Deliverables:**
- `apps/api/src/lib/era-parser.js`
  - `parseEra(eraPayload)` — extracts claim-level payment lines from Stedi 835 response
  - Returns `[{ payerClaimNumber, paidAmount, adjustmentReason, serviceLines }]`
- `apps/worker/src/era-reconciler.js`
  - Calls `stedi.listPendingEras()` → for each ERA → `parseEra` → matches to claims by `payer_claim_number`
  - Updates `claims` row: `era_received_at`, `paid_amount`, `adjustment_reason`, `status='paid'|'partially_paid'|'denied'`
  - DB migration: `claims.paid_amount NUMERIC(10,2) NULL`, `claims.adjustment_reason VARCHAR(256) NULL`
  - Calls `stedi.acknowledgeEra(eraId)` after successful processing
- Worker wired into poll loop alongside EDI status poller

**Acceptance criteria:**
- ERA processing is idempotent (re-running on same ERA does not double-post)
- Failed ERA parse logs error + leaves claim unchanged (does not corrupt)
- `era_received_at` is set on acknowledgement, not on parse (prevents acknowledging failed parses)

---

### E2 — Payment posting UI

**Story:** As a billing coordinator, I can see which claims have been paid, how much, and any adjustment reason, without leaving ChurchCore Care.

**Deliverables:**
- Update `ClaimCard.jsx` (B2) — show `paidAmount`, `adjustmentReason`, `eraReceivedAt`
- `apps/web/src/components/Billing/EraReconciliationBadge.jsx` — "ERA Received", "Partially Paid", "Denied" badge
- No manual posting in v1 — ERA-only automation

**Acceptance criteria:**
- Paid claims show green "Paid" badge with amount
- Denied claims show red "Denied" badge with adjustment reason code
- Billing coordinator can filter ClaimsList by status (submitted / accepted / paid / denied)

---

### E3 — Aging report

**Story:** As a practice administrator, I can see all unpaid claims grouped by age (0-30 / 31-60 / 61-90 / 90+ days).

**Deliverables:**
- `GET /v1/reports/claims/aging` — returns buckets with count + dollar amount
- `apps/web/src/components/Billing/AgingReport.jsx`
- Linked from AnalyticsDashboard (billing section)

**Acceptance criteria:**
- Aging calculated from `service_date`, not `created_at`
- $0 outstanding does not crash the component

---

### E4 — Patient statement generation

**Story:** As a billing coordinator, I can generate a PDF statement for a client showing their balance, paid sessions, and upcoming amounts due.

**Deliverables:**
- `apps/api/src/lib/statement-generator.js` — uses `pdf-lib` (existing dependency check required; request approval if not present)
- `GET /v1/clients/:id/statement` — streams PDF
- "Generate Statement" button in client billing tab
- Audit event: `billing.statement.generated`

**Acceptance criteria:**
- PDF contains practice name, client name (encrypted at rest, decrypted for PDF only), date range, line items
- No raw DB errors exposed if client has no billing history (empty statement PDF)
- Audit event fires even on empty statements

---

## Phase F — Group & Family Therapy

See `docs/adr/0010-group-therapy-model.md` for data model decisions.

### F1 — Group therapy data model

**Story:** As a practice administrator, I can create a therapy group with a name, assigned counselor, and recurring schedule.

**Deliverables:**
- DB migration:
  ```sql
  therapy_groups (id, tenant_id, name, counselor_id, max_members, is_active, created_at)
  group_members (id, group_id, client_id, tenant_id, joined_at, left_at)
  group_sessions (id, group_id, tenant_id, scheduled_at, duration_minutes, status, created_at)
  group_session_notes (id, group_session_id, tenant_id, counselor_id, shared_note_enc TEXT, created_at)
  group_member_notes (id, group_session_id, client_id, tenant_id, individual_note_enc TEXT, created_at)
  ```
- `apps/api/src/db/queries/groups.js` — CRUD for all tables
- Tenant isolation on all queries

**Acceptance criteria:**
- All tables have `tenant_id` and are filtered in every query
- `group_members.left_at` enables soft-removal without deleting history
- Migration is additive (no existing tables modified)

---

### F2 — Group scheduling

**Story:** As a counselor, I can schedule a recurring group session (weekly, every Tuesday at 3pm) and see it on my calendar.

**Deliverables:**
- `POST /v1/groups/:id/sessions` — creates one or recurring sessions
- `GET /v1/groups/:id/sessions` — list upcoming sessions
- Recurring session support: `rrule` string stored, expanded on read (max 52 weeks)
- Group sessions appear on counselor schedule alongside individual sessions

**Acceptance criteria:**
- Recurring sessions appear correctly on the schedule view
- Cancelling one occurrence does not cancel the series
- Max 52 future sessions created at a time (prevents runaway expansion)

---

### F3 — Group session notes

**Story:** As a counselor, I can write a shared group note and individual member notes for each group session.

**Deliverables:**
- `POST /v1/groups/sessions/:id/notes` — upsert shared + individual notes
- `GET /v1/groups/sessions/:id/notes` — returns notes with decrypted content
- `apps/web/src/components/ClinicalChart/GroupSessionNotesForm.jsx`
  - Shared note textarea (SOAP/DAP format selector)
  - Per-member individual note textareas (collapsed by default)
- Notes encrypted via `encrypt.js`
- Audit event on every note save

**Acceptance criteria:**
- Individual member notes are only visible to counselors with access to that client
- Shared note visible to all counselors in the group
- Empty individual note is not stored (null, not blank string)

---

### F4 — Relational units (couples / family)

**Story:** As a counselor, I can link two or more clients as a relational unit (couple, family), so their joint sessions are tracked together.

**Deliverables:**
- DB migration:
  ```sql
  relational_units (id, tenant_id, unit_type VARCHAR(16), label VARCHAR(128), counselor_id, created_at)
  relational_unit_members (id, unit_id, client_id, tenant_id, role VARCHAR(32), joined_at)
  ```
- `POST /v1/relational-units` — create unit with member list
- `GET /v1/relational-units/:id` — unit + members
- `apps/web/src/components/ClinicalChart/RelationalUnitCard.jsx` — shown in each member's chart
- Sessions for relational units reuse `group_sessions` with `unit_id` instead of `group_id`

**Acceptance criteria:**
- A client can be in multiple relational units (divorce + new partner scenario)
- Removing a member sets `left_at` (soft delete)
- Chart shows which unit(s) the client belongs to with click-through

---

### F5 — Group billing

**Story:** As a billing coordinator, I can generate a claim for each member of a group session with the correct group therapy CPT code.

**Deliverables:**
- `apps/api/src/lib/group-billing.js`
  - `buildGroupClaims({ groupSessionId, tenantId })` — one claim per active member
  - CPT code mapping: 90853 (group psychotherapy), 90849 (multiple family group)
- `POST /v1/groups/sessions/:id/billing/submit` — builds + submits claims via Stedi
- Group claims appear in `ClaimsList.jsx` filtered by `group_session_id`

**Acceptance criteria:**
- Correct CPT code used per unit type (group vs family)
- One claim per member, not one claim for the session
- Claim submission is idempotent (second submit returns existing submission ID)

---

## Dependency order

```
C1 → C2 → C3 → C4 → C5 → C6 → C7
D1 → D2 → D3 → D4 → D5
E1 → E2 → E3 → E4
F1 → F2 → F3 → F4 → F5
```

Phases C, D, E, F can run in parallel once their respective Phase 1 items (C1, D1, E1, F1)
are complete. D1 and E1 have no dependencies on each other or on C.

---

## Progress tracker

| ID | Story | Status |
|---|---|---|
| C1 | PWA scaffold | ✅ |
| C2 | Mobile auth | ✅ |
| C3 | Today's schedule | ✅ |
| C4 | Client quick search | ✅ |
| C5 | Quick note entry | ✅ |
| C6 | Push notifications | ✅ |
| C7 | Capacitor wrapper | ☐ optional |
| D1 | Analytics API | ✅ |
| D2 | Practice dashboard | ✅ |
| D3 | Outcome trends | ✅ |
| D4 | Counselor productivity | ✅ |
| D5 | Export CSV | ✅ |
| E1 | ERA parsing | ✅ |
| E2 | Payment posting UI | ✅ |
| E3 | Aging report | ✅ |
| E4 | Patient statements | ✅ |
| F1 | Group data model | ✅ |
| F2 | Group scheduling | ✅ |
| F3 | Group notes | ✅ |
| F4 | Relational units | ✅ |
| F5 | Group billing | ✅ |

**Total:** 21 items (20 code + 1 optional)

---

## Admin tasks (require human action)

| Task | Phase |
|---|---|
| Apple Developer account ($99/yr) for App Store | C7 |
| Google Play Developer account ($25 one-time) | C7 |
| VAPID key pair generation and storage in Secret Manager | C6 |
| GitHub repo Variables: `GCP_REGION`, `GCP_PROJECT_ID` | Deploy |
| pdf-lib dependency approval | E4 |
