# ChurchCore Care — Competitive Evaluation & MVP Assessment

**Date:** May 26, 2026
**Author:** Engineering and product review
**Purpose:** Determine MVP readiness, competitive position, and priority gaps for SaaS launch

---

## Executive Summary

ChurchCore Care is **past MVP** by a significant margin. At v6.1.0 with 150+ API endpoints, four telehealth phases delivered, a 75-rule audit intelligence engine, faith-integrated clinical workflows with no competitor equivalent, and a multi-tenant SaaS architecture in final assembly, this is not a question of "do we have enough?" — it is a question of "what unlocks commercial launch and what keeps us competitive once there?"

**Verdict on MVP:** Yes. The core workflow (intake → scheduling → charting → billing → portal → telehealth) is complete, clinical-grade, and differentiated. The PRD first-release scope has been delivered and significantly exceeded.

**Verdict on competitive position:** Unique and defensible on faith integration. Parity or better on documentation, scheduling, portal, and audit. Gaps remain in three areas that affect purchase decisions: EDI claim submission, AI-assisted note drafting, and multi-tenant infrastructure for commercial launch.

**Three things needed before first customer:**
1. Multi-tenant SaaS infrastructure live (Phase 4) — without it, you cannot sell to multiple practices
2. HIPAA BAA documentation ready — without it, you cannot sign enterprise agreements
3. A subscription billing mechanism — without it, you cannot collect revenue

**Three things needed within 90 days of launch to stay competitive:**
4. AI session note drafting — now an expected feature in the category
5. EDI/clearinghouse claim submission — the #1 reason practices reject a platform
6. Insurance eligibility verification — prerequisite for smooth billing workflow

---

## Part 1: What Has Been Built

The original PRD scoped a careful first release and listed several deliberate exclusions. Most of those exclusions have since been delivered. Here is the current actual state:

### Delivered (exceeding original PRD scope)

| Area | Status | Notes |
| --- | --- | --- |
| Scheduling | ✅ Full | Calendar, recurring series, conflict detection, appointment types, CPT codes |
| Clinical documentation | ✅ Full | Session notes, treatment plans, progress notes, homework |
| Faith-integrated notes | ✅ Full | Scripture refs, prayer journaling, spiritual practices, faith integration levels |
| Supervision / cosign | ✅ Full | Intern relationships, pending review, cosign workflow, audit logged |
| Licensure time tracking | ✅ Full | Direct clinical, indirect/admin, CE, supervisor verification, CSV export |
| Faithful Workflows | ✅ Full | 27 deterministic rules, 8 care categories, 3 canvas views (Classic, Radial Hub, Priority Matrix) |
| Client portal | ✅ Phases 1–2 | Auth, forms, documents, appointments, messaging, resources, portal branding |
| Telehealth video | ✅ Phases 1–3 | JaaS/Jitsi, client join links, embedded video, RS256 JWT, audit logged |
| Billing foundation | ✅ Foundation | Invoices, superbills, payments, service codes, fee schedules, aging reports |
| Audit Intelligence | ✅ Full | 75-rule deterministic engine, severity-tiered, no AI dependency, + optional Claude AI observations |
| Operations Dashboard | ✅ Full | Daily ops, counselor workload, note-gap compliance, 7-day trends, portal request tracking |
| Workspace Studio | ✅ Full | Practice profile, locations, staff roster, lifecycle board, appointments, documents, offerings, portal admin |
| Multi-tenant architecture | 🟡 Phase 4 in dev | Per-tenant DB pool registry, host-based routing, provisioning lifecycle, platform admin scaffolding |
| RBAC | ✅ Full | 7 roles, middleware enforced, CSRF, session management |
| PHI security | ✅ Full | argon2, AES-256-GCM at rest, 3-min idle timeout, audit trail |
| API documentation | ✅ Full | 150+ endpoints, OpenAPI 3.1, live Swagger UI |
| i18n | ✅ Full | Multi-language runtime, locale resolution |
| Load testing | ✅ Full | 6 scenarios, k6-based |
| Telehealth (original PRD exclusion) | ✅ Delivered |  |
| E2E test suite | ✅ Full | Playwright, high-value journeys, launch readiness |

### Still Missing from Market Standard

| Gap | Severity | Notes |
| --- | --- | --- |
| Multi-tenant SaaS live | 🔴 LAUNCH BLOCKER | Phase 4 in dev; cannot serve multiple paying customers without it |
| Subscription billing (Stripe) | 🔴 LAUNCH BLOCKER | No mechanism to charge practices |
| HIPAA BAA ready | 🔴 LAUNCH BLOCKER | Must be signed before any PHI touches production |
| EDI / clearinghouse claim submission | 🟠 HIGH | #1 purchasing objection in the category; superbills are not enough for insurance-heavy practices |
| AI session note drafting | 🟠 HIGH | Now market expectation — SimplePractice, TherapyNotes, Alma, Ease Health all offer this |
| Insurance eligibility verification | 🟠 HIGH | Expected alongside billing; blocks fully automated billing workflow |
| Client self-scheduling | 🟡 MEDIUM | Portal has appointment requests; direct self-booking is becoming standard |
| Native mobile apps | 🟡 MEDIUM | TherapyNotes launched mobile in 2026; SimplePractice has full iOS/Android; web-only is a differentiator risk |
| Measurement-based care dashboard | 🟡 MEDIUM | PHQ-9 is stored; a dedicated outcomes tracking dashboard (Alma/SimplePractice style) is not visible |
| Credentialing support | 🟢 LOW | Alma's major hook; external services exist; not needed for launch |

---

## Part 2: Competitive Landscape — 2026 Update

The 2026 market has shifted since the original competitive analysis. Four significant changes:

### 1. AI notes are no longer a differentiator — they are table stakes

In early 2026, AI-assisted documentation is an add-on for most platforms ($35–$50/month) but is expected to exist. By 2027 it will be included in base pricing. The category has moved:

- **SimplePractice:** AI Note Taker ($35/mo add-on, powered by Claude) — SOAP/DAP/BIRP formats, live telehealth transcription
- **TherapyNotes:** TherapyFuel AI ($40/mo add-on) — ambient transcription and summary-to-note
- **Alma:** Note Assist (included, video sessions only)
- **Ease Health:** Voice AI documentation ($50/mo add-on)
- **Upheal:** AI-native at $1/session — the most aggressive pricing in the category

ChurchCore Care has AI in Audit Intelligence but not in session note drafting. This will become a conversion blocker as the market normalizes around AI documentation.

### 2. Ease Health emerged with $41M from a16z and is redefining group practice expectations

Ease Health (emerged from stealth February 2026, $41M Series A from Andreessen Horowitz) is an AI-native EHR + RCM + CRM platform targeting group practices (6+ clinicians). Pricing: ~$115/seat, 5–6% on insurance collections, + add-ons. Their positioning: eliminate multi-vendor contracts, 99% first-pass insurance claim acceptance, AI documentation. This is not a direct competitor (too enterprise, no faith integration) but it raises the bar for what "serious" looks like to group practices.

### 3. TherapyNotes launched a mobile app in 2026

This closes a gap ChurchCore Care still has. TherapyNotes mobile is first-generation, but the category is moving toward mobile-first. SimplePractice's native iOS/Android apps remain the gold standard.

### 4. No new faith-based competitors emerged

The faith-based Christian counseling EHR space remains empty. SimplePractice published educational content about faith integration in therapy (editorial, not product features). No platform has added native faith features. ChurchCore Care's moat on this dimension is intact and widening.

### Competitive Position Matrix — May 2026

| Dimension | SimplePractice | TherapyNotes | Alma | Ease Health | **ChurchCore Care** |
| --- | --- | --- | --- | --- | --- |
| Faith integration | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Faithful Workflows (clinical decision support) | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Supervision / licensure tracking | Limited | Limited | ✗ | ✗ | **★★★★★** |
| Audit Intelligence | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| PHI security / audit trail | ★★★ | ★★★ | ★★★ | ★★★ | **★★★★★** |
| Clinical documentation | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ | ★★★★ |
| Scheduling | ★★★★★ | ★★★★ | ★★★ | ★★★★ | ★★★★ |
| Telehealth | ★★★★★ | ★★★★ | ★★★★ | ★★★★ | ★★★★ |
| Client portal | ★★★★★ | ★★★ | ★★★ | ★★★ | ★★★★ |
| Billing (superbill + invoicing) | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | ★★★ |
| EDI claim submission | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | ✗ |
| Insurance eligibility | ★★★★★ | ★★★ | ★★★★ | ★★★★★ | ✗ |
| AI session notes | ★★★★ (add-on) | ★★★★ (add-on) | ★★★ (video only) | ★★★★ (add-on) | ✗ |
| Native mobile app | ★★★★★ | ★★★ (2026) | ✗ | ✗ | ✗ |
| Operations dashboard | ✗ | ✗ | ✗ | ✗ | **★★★★★** |
| Feature completeness | ★★★★★ | ★★★★ | ★★★ | ★★★★ | ★★★★ |
| Pricing (solo) | ★★★ | ★★★★ | ★★★ | ★★ | ★★★★★ (target) |
| Niche fit (Christian counseling) | ✗ | ✗ | ✗ | ✗ | **★★★★★** |

**Summary:** ChurchCore Care wins every faith dimension by default and has no real competition there. On general feature parity it is competitive with TherapyNotes and close to SimplePractice. The billing/claims and AI notes gaps are the two places where losing a sale is most likely.

---

## Part 3: MVP Verdict and Launch Readiness

### Is this an MVP?

Yes — and more. ChurchCore Care at v6.1.0 is a full product, not a minimum viable one. A counselor can:

1. Open a practice account, set up locations and staff
2. Onboard a new client through intake, consent, and assessment
3. Schedule recurring appointments
4. Join a telehealth video session embedded in the platform
5. Complete a session note with scripture references and spiritual practice tracking
6. Generate a superbill and invoice
7. Run Faithful Workflows to get deterministic clinical decision support
8. Query the Audit Intelligence engine for security and behavioral anomalies
9. Track supervision hours and cosign intern notes
10. Monitor all of the above on an operations dashboard

No competitor does all of this. No competitor does any of the faith-integrated items.

### What blocks commercial launch (not MVP — launch)

**Must be done before first paying customer:**

| Blocker | Why | Effort |
| --- | --- | --- |
| **Multi-tenant SaaS Phase 4 complete** | Can't serve multiple practices; tenant provisioning, platform admin, and billing model must work end-to-end | Phase 4 in dev — largest item |
| **Subscription billing (Stripe)** | No way to charge practices; need Stripe integration for monthly subscriptions, trial management, cancellation | Medium |
| **HIPAA BAA signed with all vendors** | Legal requirement before any PHI touches production (GCP BAA, any third-party integrations) | Low effort; admin task |
| **Production environment on GCP** | Deployment spec exists; Dockerfiles needed; Firebase Hosting for web, Cloud Run for API + Worker | Medium (spec exists) |

### What blocks staying competitive (post-launch, within 90 days)

| Gap | Why it matters | Effort |
| --- | --- | --- |
| **AI session note drafting** | SimplePractice, TherapyNotes, Alma all offer this; it will become a conversion question on every demo. Leverage existing Anthropic integration from Audit Intelligence. | Medium — the API is already integrated |
| **EDI claim submission** | Most practices bill insurance. Superbills work for self-pay; they are insufficient for insurance-heavy practices. A clearinghouse integration (Stedi, Change Healthcare, Availity) closes the largest purchase objection. | Medium-high |
| **Insurance eligibility verification** | Expected alongside billing claims; automated eligibility checks before appointments reduce claim denials | Medium |

---

## Part 4: Strategic Recommendations

### Pricing — where to land

| Plan | Target Price | What's included |
| --- | --- | --- |
| Solo | $69/month | 1 counselor, full clinical, telehealth, portal, faith workflows |
| Group | $99/month | Up to 3 counselors, + supervision tracking, operations dashboard |
| Per additional counselor | $39/month | — |
| AI Notes add-on (future) | $29/month | When AI note drafting ships; price below SimplePractice's $35 |

This puts ChurchCore Care below SimplePractice Essential at $79 and TherapyNotes Solo at $69, while including telehealth (SimplePractice includes it; TherapyNotes adds it; Alma includes it at $125). The faith integration has no price equivalent — any faith-specific counselor will pay $69 over $79 for a platform built for them.

### Go-to-market — highest-leverage moves

1. **AACC (American Association of Christian Counselors) — 50,000+ members.** A conference sponsorship or software partnership reaches the entire addressable market in one motion. Their annual conference is the single highest-leverage marketing event in the category.

2. **Seminary counseling programs.** Students graduating from Christian seminary counseling tracks are forming practices. Catch them before they default to SimplePractice. A student/new-practice rate ($29/month for year one) builds lifetime customers.

3. **Church network pastoral counseling centers.** Many larger churches run internal counseling ministries or affiliated counseling centers — these are group practice accounts that need multi-counselor support and intern supervision. ChurchCore Care is uniquely built for this model.

4. **Lead with Faithful Workflows and supervision.** SimplePractice cannot replicate these without alienating secular customers. This is the stickiest part of the product — once workflows are configured and supervision relationships are set up, switching cost is high.

### Roadmap priority order

**Phase A — Launch readiness (before first customer):**
- Complete multi-tenant SaaS Phase 4
- Stripe subscription billing
- HIPAA BAA and production GCP deployment
- 30-day free trial flow

**Phase B — Closing the competitive gap (0–90 days post-launch):**
- AI session note drafting (leverage existing Anthropic integration)
- EDI clearinghouse integration (Stedi is the best API-first option)
- Insurance eligibility verification

**Phase C — Deepening the moat (3–12 months):**
- Client self-scheduling from the portal
- Expanded faith content library (pre-built Christian CBT templates, spiritually integrated intake packs, faith-based treatment goal banks)
- AACC directory integration / find-a-counselor listing
- Mobile-responsive progressive web app (bridge to native apps)
- Church/ministry plan (group account with ministry-specific features)

**Phase D — Future differentiation (12+ months):**
- Native iOS/Android apps
- Group practice analytics and benchmarking
- Integration with church management systems (Planning Center, Breeze)

---

## Part 5: The Honest Assessment

### Where we win

ChurchCore Care owns a dimension that no competitor can quickly enter. Faith integration at the platform level — not a template, not a checkbox, but woven into the session note structure, the clinical decision engine, the intake workflow, the supervision model, and the portal — is genuinely unique. A Christian counselor using SimplePractice is using a tool that has never thought about them. A counselor using ChurchCore Care is using a tool that was built for them.

The security and audit story is also a differentiator. 75-rule audit intelligence, AES-256-GCM PHI encryption, 3-minute idle timeout, and a full structured audit ledger are more rigorous than any competitor offers. For a platform handling sensitive clinical data in a faith context — where trust is not just a business requirement but a spiritual one — this matters to the customer in ways that can't be dismissed.

The Faithful Workflows clinical decision engine (27 deterministic rules, 8 care categories, 3 canvas views) has no equivalent anywhere in the market. No competitor has anything close to a deterministic clinical recommendation layer. This is a genuine product innovation.

### Where we are exposed

**AI notes** is the most visible gap on a sales demo. Every other platform can show a counselor typing a session and watching a draft note appear. ChurchCore Care cannot yet. This will come up in every evaluation against SimplePractice. The good news: the Anthropic API is already integrated for Audit Intelligence — the infrastructure exists. The AI session note feature is an application-layer build, not an infrastructure problem.

**Billing and claims** is the deeper exposure. A practice that bills insurance heavily will notice immediately that ChurchCore Care does not submit claims electronically. Many Christian counselors are in private-pay practices where superbills are sufficient — but many are not. A clearinghouse integration is the highest-ROI missing feature for purchase conversion.

**Multi-tenant infrastructure** is the current launch gate. Phase 4 is in active development and the architecture is well-designed (per the existing docs). This needs to land before any sales motion makes sense.

### The bottom line

ChurchCore Care is a real, complete, differentiated product. It is not chasing SimplePractice — it is building in a space SimplePractice cannot occupy. The moat is genuine. The launch blockers are known and finite. The competitive gaps are buildable with the infrastructure already in place. The market opportunity is uncontested.

The question is not whether to launch. The question is what order to close the remaining gaps to enter the market with the highest conversion rate and the widest defensible surface.

---

*Sources: SimplePractice (simplepractice.com/pricing), TherapyNotes (therapynotes.com, blog.therapynotes.com), Alma (helloalma.com), Ease Health (businesswire.com, ehrsource.com), Upheal (upheal.io), AACC (aacc.net), ChurchCore Care README v6.1.0, docs/competitive-analysis.md, docs/prd.md, docs/PRODUCT-PLANS-OVERVIEW.md.*
