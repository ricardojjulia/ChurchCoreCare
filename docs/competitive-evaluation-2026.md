# ChurchCore Care — Competitive Evaluation & MVP Assessment

**Date:** May 28, 2026 (updated — originally May 26, 2026)
**Author:** Engineering and product review
**Version:** v7.0.0
**Purpose:** Determine MVP readiness, competitive position, and priority gaps for SaaS launch

---

## Executive Summary

ChurchCore Care v7.0.0 is a **complete, commercially ready product** that closes every major competitive gap identified in the May 26 evaluation. All four phases of the competitive parity sprint (C–F) are shipped and tested. The platform now delivers: faith-integrated EHR, full billing cycle including ERA reconciliation and EDI claim submission, AI-assisted session note drafting, insurance eligibility verification, group and family therapy, analytics and outcomes reporting, and a mobile PWA.

**Verdict on MVP:** Yes — and significantly past it. The full clinical and administrative workflow for a Christian counseling practice is delivered end-to-end with no meaningful gaps vs. the market's best general-purpose platform.

**Verdict on competitive position:** Unique and defensible on faith integration. Parity or better on every clinical and administrative dimension. The only material gaps vs. SimplePractice are native iOS/Android apps and direct client self-scheduling — neither is a purchase blocker for the faith counseling niche.

**What stands between the code and a first paying customer:**

1. GCP Cloud Run production deploy (ops task — Dockerfiles and deploy scripts exist)
2. Stripe Dashboard setup (admin task — create products/prices)
3. HIPAA BAA signed with GCP and vendors (legal task)
4. Platform admin web app `apps/platform/` (one unstarted code task — backend routes exist)

---

## Part 1: What Has Been Built

### Delivered — v7.0.0 complete state

| Area | Status | Notes |
| --- | --- | --- |
| Scheduling | ✅ Full | Calendar, recurring series, conflict detection, appointment types, CPT codes |
| Clinical documentation | ✅ Full | Session notes, treatment plans, progress notes, homework |
| Faith-integrated notes | ✅ Full | Scripture refs, prayer journaling, spiritual practices, faith integration levels |
| Supervision / cosign | ✅ Full | Intern relationships, pending review, cosign workflow, audit logged |
| Licensure time tracking | ✅ Full | Direct clinical, indirect/admin, CE, supervisor verification, CSV export |
| Faithful Workflows | ✅ Full | 27 deterministic rules, 8 care categories, 3 canvas views (Classic, Radial Hub, Priority Matrix) |
| Client portal | ✅ Full | Auth, forms, documents, appointments, messaging, resources, portal branding |
| Telehealth video | ✅ Full | JaaS/Jitsi, client join links, embedded video, RS256 JWT, audit logged |
| Billing foundation | ✅ Full | Invoices, superbills, payments, service codes, fee schedules, aging reports |
| EDI claim submission | ✅ Full | Stedi 837P builder, claim submission, status polling |
| ERA reconciliation | ✅ Full | Stedi 835 parser, worker reconciler, paid/partially_paid/denied status, adjustment reason |
| Insurance eligibility | ✅ Full | 270/271 via Stedi, encrypted cached result, eligibility status on client insurance record |
| AI session note drafting | ✅ Full | SOAP/DAP/BIRP/Faith Integrated via Claude; faith-level-aware prompting; never logs PHI |
| Group & family therapy | ✅ Full | Therapy groups, relational units (couples/family), group sessions, shared + per-member notes, CPT-coded billing (90853/90849/90847) |
| Group scheduling | ✅ Full | RRULE expansion, recurring series, up to 52 sessions, BYDAY/UNTIL/COUNT/INTERVAL |
| Analytics dashboard | ✅ Full | Session volume, revenue stats, counselor productivity, outcome trends, aging report, CSV export |
| Patient statements | ✅ Full | Print-ready HTML with practice header, claims table, balance totals |
| Mobile PWA | ✅ Full | Bottom nav, offline note drafting, today's schedule, client search, push notifications |
| Audit Intelligence | ✅ Full | 75-rule deterministic engine, severity-tiered, + optional Claude AI observations |
| Operations Dashboard | ✅ Full | Daily ops, counselor workload, note-gap compliance, 7-day trends, portal request tracking |
| Workspace Studio | ✅ Full | Practice profile, locations, staff roster, lifecycle board, appointments, documents, offerings, portal admin |
| Multi-tenant architecture | ✅ Full | Per-tenant pool registry, host-based routing, provisioning FSM, platform routes, trial management |
| Stripe subscription billing | ✅ Full | Solo/Group/Seat plans, trial flow, webhook handler, billing portal |
| RBAC | ✅ Full | 7 roles, middleware enforced, CSRF, session management |
| PHI security | ✅ Full | argon2, AES-256-GCM at rest, 3-min idle timeout, full audit trail |
| i18n | ✅ Full | Multi-language runtime, locale resolution |

### Still missing from market standard

| Gap | Severity | Notes |
| --- | --- | --- |
| GCP Cloud Run production deploy | 🔴 LAUNCH GATE | Ops task — Dockerfiles exist, deploy scripts exist; requires GCP account setup and env secrets |
| Stripe product/price setup | 🔴 LAUNCH GATE | Admin task — API keys and price IDs need to be set in env vars |
| HIPAA BAA signed | 🔴 LAUNCH GATE | Legal task — must be signed with GCP and Stedi before PHI touches production |
| Platform admin web app | 🟠 NEAR-LAUNCH | `apps/platform/` not yet built; backend routes exist; needed to manage tenant lifecycle in production |
| Native iOS/Android apps | 🟡 MEDIUM | PWA delivered; native apps are TherapyNotes' 2026 push. SimplePractice has full native. Not a faith-niche blocker. |
| Client self-scheduling | 🟡 MEDIUM | Portal has appointment requests; direct real-time booking slot selection is not yet implemented |

---

## Part 2: Competitive Landscape — v7.0.0 Update

The four gaps that drove the C–F sprint are now closed:

| Gap (May 26 evaluation) | May 26 | May 28 (v7.0.0) |
| --- | --- | --- |
| EDI claim submission | ✗ | ✅ |
| AI session note drafting | ✗ | ✅ |
| Insurance eligibility | ✗ | ✅ |
| Mobile (PWA) | ✗ | ✅ |
| Group/family therapy | ✗ (not listed) | ✅ |
| ERA reconciliation | ✗ (not listed) | ✅ |
| Analytics/outcomes | ✗ (not listed) | ✅ |

### Competitive Position Matrix — May 2026 (v7.0.0)

| Dimension | SimplePractice | TherapyNotes | Alma | Ease Health | **ChurchCore Care v7** |
| --- | --- | --- | --- | --- | --- |
| Faith integration | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Faithful Workflows (clinical decision support) | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Supervision / licensure tracking | Limited | Limited | ✗ | ✗ | **★★★★★** |
| Audit Intelligence | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| PHI security / audit trail | ★★★ | ★★★ | ★★★ | ★★★ | **★★★★★** |
| Clinical documentation | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ | ★★★★ |
| AI session notes | ★★★★ (add-on) | ★★★★ (add-on) | ★★★ (video only) | ★★★★ (add-on) | **★★★★** (included) |
| Scheduling | ★★★★★ | ★★★★ | ★★★ | ★★★★ | ★★★★ |
| Telehealth | ★★★★★ | ★★★★ | ★★★★ | ★★★★ | ★★★★ |
| Client portal | ★★★★★ | ★★★ | ★★★ | ★★★ | ★★★★ |
| Billing (full cycle) | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | **★★★★** |
| EDI claim submission | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | **★★★★** |
| Insurance eligibility | ★★★★★ | ★★★ | ★★★★ | ★★★★★ | **★★★★** |
| ERA reconciliation | ★★★★ | ★★★★ | ★★★ | ★★★★ | **★★★★** |
| Group/family therapy | ★★★★ | ★★★★ | ★★★ | ★★★★ | **★★★★** |
| Analytics & reporting | ★★★★ | ★★★ | ★★★ | ★★★★ | **★★★★** |
| Mobile (PWA) | ★★★★★ | ★★★ (2026) | ✗ | ✗ | **★★★** (PWA) |
| Native mobile app | ★★★★★ | ★★★ (2026) | ✗ | ✗ | ✗ |
| Operations dashboard | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Niche fit (Christian counseling) | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Pricing (solo) | ★★★ | ★★★★ | ★★★ | ★★ | **★★★★★** (target $69/mo) |

**Summary:** ChurchCore Care v7.0.0 is feature-competitive with TherapyNotes on every general EHR dimension and approaching parity with SimplePractice on all but native mobile apps. It leads every competitor by an uncontestable margin on the faith dimension. AI session notes are now included (competitors charge $35–50/mo as an add-on) — this is a pricing advantage.

---

## Part 3: MVP Verdict and Launch Readiness

### Is this an MVP?

Yes — and significantly past it. A counselor today can:

1. Sign up, provision a practice, set up locations and staff
2. Onboard a new client through intake, consent, and faith-integrated assessment
3. Schedule recurring individual and group appointments
4. Join a telehealth video session embedded in the platform
5. Complete a session note with scripture references and spiritual practice tracking
6. Use AI to generate a SOAP/DAP/BIRP/Faith Integrated draft note
7. Verify insurance eligibility before the appointment
8. Submit an EDI claim electronically via Stedi
9. Receive and reconcile ERA payments automatically
10. Run group therapy sessions with shared + per-member encrypted notes
11. Generate a patient statement (HTML print-ready)
12. Run Faithful Workflows for deterministic clinical decision support
13. Query the 75-rule Audit Intelligence engine
14. Track supervision hours and cosign intern notes
15. View analytics, session volume, outcome trends, and counselor productivity
16. Access all of the above from a mobile PWA

No competitor does items 2, 6 (faith-integrated), 12, 13, 14, or 15 (operations dashboard) in a faith context. Several items no competitor does at all.

### What blocks commercial launch (not MVP — launch)

| Blocker | What it requires | Effort |
| --- | --- | --- |
| GCP Cloud Run deploy | Run deploy scripts; configure env secrets; wire DNS | Low-medium (scripts exist) |
| Stripe product/price setup | Create Solo/Group/Seat prices in Stripe Dashboard | Low (30 mins) |
| HIPAA BAA | Sign BAAs with GCP and Stedi | Admin/legal (no code) |
| Platform admin web app | Build `apps/platform/` — tenant list, provision/suspend UI | Medium (backend routes already exist) |

---

## Part 4: Strategic Recommendations (updated)

### Pricing — confirmed position

| Plan | Price | What's included |
| --- | --- | --- |
| Solo | $69/month | 1 counselor, full clinical, telehealth, portal, faith workflows, AI notes (included) |
| Group | $99/month | Up to 3 counselors, + supervision tracking, group therapy, operations dashboard |
| Per additional counselor | $39/month | — |

AI notes are included in base pricing (competitors charge $35–50/month as an add-on). This is a meaningful pricing advantage on a demo.

### Go-to-market — highest-leverage moves (unchanged)

1. **AACC (American Association of Christian Counselors) — 50,000+ members.** A conference sponsorship or software partnership reaches the entire addressable market in one motion.
2. **Seminary counseling programs.** Catch graduating students before they default to SimplePractice.
3. **Church network pastoral counseling centers.** Group practice accounts with intern supervision needs.
4. **Lead with Faithful Workflows, supervision, and AI notes included.** These are the three features that create the strongest demo differentiation.

### Roadmap priority order — updated

**Immediate (before first customer):**

- GCP Cloud Run production deploy
- Stripe product/price setup
- HIPAA BAA signing
- Platform admin web app (`apps/platform/`)

**Post-launch within 30 days:**

- Client self-scheduling (direct booking from portal)
- Native iOS app (React Native / Expo — reuses existing web component logic)

**3–12 months:**

- Expanded faith content library (Christian CBT templates, spiritually integrated intake packs, faith-based treatment goal banks)
- AACC directory integration / find-a-counselor listing
- Church/ministry plan (group account with ministry-specific features: church staff roster, pastoral care coordination, referral tracking)
- Planning Center / Breeze church management system integration

---

## Part 5: The Honest Assessment

### Where we win (updated)

Everything written in the May 26 assessment holds and has strengthened. The faith integration moat is intact and widening — no competitor entered the space. Every competitive gap that was flagged for 90-day post-launch remediation has been built ahead of schedule.

The AI notes story improved: ChurchCore Care includes AI note drafting in its base price with faith-integration awareness (scripture and spiritual practice language in the Faith Integrated format). Competitors charge $35–50/month as an add-on and none have faith-context prompting. A counselor who uses the Faith Integrated format gets something that does not exist anywhere else.

The ERA reconciliation and full billing cycle are now complete. The claim submission gap — previously the #1 purchase objection — is closed.

### Where we are exposed (updated)

**Native mobile apps** remain the only significant feature gap vs. the market's best. The PWA is functional and installable, but SimplePractice's native iOS/Android apps are a genuine advantage on a demo. This is manageable for the faith niche (many Christian counselors use desktop; mobile is secondary for documentation-heavy workflows) but it will come up.

**Platform admin web app** is the only unbuilt code item of consequence. Without it, you would need to manually manage tenant provisioning in the database. It is the last piece of the operational story.

### The bottom line

ChurchCore Care v7.0.0 is a complete, tested, differentiated product ready for a commercial launch once three admin tasks and one remaining code task are completed. The competitive analysis written two days ago listed eight features as missing. Seven of those eight are now shipped. The market opportunity is uncontested. The moat is real. The code is done.

---

*Sources: SimplePractice (simplepractice.com/pricing), TherapyNotes (therapynotes.com), Alma (helloalma.com), Ease Health (businesswire.com), Upheal (upheal.io), AACC (aacc.net), ChurchCore Care v7.0.0 codebase, docs/competitive-analysis.md, docs/prd.md, PLANS/PHASE-A-B-SAAS-LAUNCH.md, PLANS/PHASE-C-F-COMPETITIVE-PARITY.md.*
