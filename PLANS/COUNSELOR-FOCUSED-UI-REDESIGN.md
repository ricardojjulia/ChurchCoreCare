# Counselor-Focused UI Redesign Plan

## Status

Proposed

## Prepared

April 2, 2026

## Purpose

This plan defines how Faith Counseling should evolve from a broad operations-heavy workspace into a counselor-focused product that still preserves the platform's operational depth, monitoring coverage, and security posture.

The current UI is functional and broad, but it does not yet consistently feel:

- powerful for daily counselor work
- easy for non-technical staff to learn
- focused on the counselor's next action
- trustworthy as a polished production product

This plan establishes the product and UX direction needed to close that gap.

## Relationship To Canonical Plans

This plan does not replace the canonical implementation standards already defined elsewhere.

- `PLANS/FULL-SURFACE-MONITORING.md` remains the source of truth for surface telemetry, registry coverage, monitoring-page representation, and OTEL/local monitoring behavior.
- `PLANS/FULL-SECURITY-AND-AUDITING.md` remains the source of truth for auth, RBAC, auditing, PHI boundaries, tenant isolation, export controls, and security semantics.

Any UI work executed from this plan must continue to satisfy both standards.

## Product Position

Faith Counseling should feel like:

- a counselor's daily workspace first
- an operations and compliance platform second
- a technical monitoring/admin environment third

The current product posture is too often reversed.

## Current-State Assessment

The current setup does not yet live up to the goal of a powerful, user-friendly, non-technical, counselor-focused software package.

### What is working

- The product already covers a large amount of real workflow surface area.
- Scheduling, charting, portal, forms, counselor/client records, and faith-oriented workflows already exist.
- Shared telemetry and monitoring discipline are stronger than average for a product at this stage.
- The UI shell is reasonably consistent across many surfaces.

### What is not working

- The default experience is operations-first instead of counselor-first.
- Navigation exposes too many top-level concepts for a non-technical user.
- Several visible areas still feel internal, unfinished, or demo-oriented.
- The information architecture emphasizes platform structure instead of counselor tasks.
- Counselor work is spread across separate workspaces rather than organized around a simple daily flow.
- Some labels sound administrative, operational, or technical instead of clinical and supportive.
- The application has large, state-heavy UI modules that will be difficult to refine safely without more structure.

## Primary Problems To Solve

### 1. Wrong default landing experience

Most authenticated staff land in an operations dashboard rather than a counselor home oriented around:

- today's schedule
- notes due
- client follow-up
- quick handoff into charting and scheduling

### 2. Overloaded navigation

The current top-level navigation is broad and platform-centric. It asks counselors to understand internal product structure such as:

- dashboard
- workspace studio
- operations studio
- monitoring
- offerings
- faith workflows

This increases cognitive load and weakens task focus.

### 3. Counselor workflow fragmentation

A counselor's daily work is split across multiple disconnected destinations:

- client list
- scheduling
- clinical chart
- documents
- faith workflows
- portal preview

The product should instead feel like one guided working environment.

### 4. Production trust gaps

Visible placeholder tabs, demo-oriented copy, preview-oriented auth language, and mock-client behavior reduce confidence in the product.

### 5. Too much product language, not enough user language

The UI often describes the system in product-team or admin terms rather than counselor terms. This creates friction for non-technical users and obscures value.

## North Star

When a counselor signs in, they should immediately understand:

- who they need to see today
- what requires documentation or follow-up
- where risk or urgency exists
- what their next click should be

When an administrator signs in, they should still be able to reach deeper operations, compliance, portal, and monitoring tools without those tools dominating the counselor experience.

## Design Principles

### Role-first, not platform-first

Default navigation, landing pages, and quick actions should be shaped by the signed-in role.

### Daily-workflow-first

The main experience should be organized around the sequence counselors actually follow:

1. prepare for the day
2. review people and priorities
3. document care
4. coordinate scheduling and follow-up
5. complete supporting tasks

### Progressive disclosure

Show the simplest useful surface first. Reveal advanced tools only when needed.

### Warm, clinical, and trustworthy

The product should feel calm, clear, and professional. It should avoid both sterile admin-tool energy and overly decorative consumer-app styling.

### Fewer destinations, stronger destinations

Reduce the number of top-level concepts. Make each retained destination more complete and more intuitive.

### No visible "fake" product

Placeholder, preview, or demo-only behavior should not appear in normal production paths.

### Monitoring and security are built in, not bolted on

Every redesigned visible surface must preserve required monitoring coverage and security boundaries.

## Target User Experience

### Counselor experience

Counselors should have a focused workspace with a small set of high-value destinations:

- Home
- Clients
- Schedule
- Charting
- Tasks
- Resources

Home should answer:

- What do I have today?
- Who needs follow-up?
- Which notes are due?
- What should I open first?

### Practice admin experience

Practice owners, practice admins, and platform admins should get:

- the same polished core workflow experience
- additional administrative workspaces
- access to deeper operational controls
- access to monitoring, auditing, and platform tools

### Client portal experience

The portal should remain client-centered and operationally separate from staff workflows. Staff preview capabilities should not dominate normal staff navigation.

## Proposed Information Architecture

### Counselor primary navigation

- Home
- Clients
- Schedule
- Charting
- Tasks

Optional secondary navigation:

- Documents
- Resources

### Admin-only navigation

- Team
- Practice Setup
- Portal Operations
- Reporting
- Monitoring
- Security and Audit

### Navigation changes

- Remove or hide technical/admin destinations from counselor default navigation.
- Move monitoring and operations tools behind admin-only access.
- Eliminate "workspace" and "studio" terminology from counselor-facing paths unless the term is proven necessary.
- Collapse overlapping areas where possible.

## Proposed Surface Model

### 1. Counselor Home

Create a dedicated counselor landing page that prioritizes:

- today's sessions
- next appointment
- unsigned or incomplete notes
- high-priority client follow-up
- care-plan and homework actions
- quick entry into the current client chart

This page should replace the current operations-centric default for counselor roles.

### 2. Clients

Refocus the client list around counselor work:

- recent activity
- next appointment
- documentation status
- risk/follow-up indicators
- direct chart access

Reduce emphasis on administrative toggles that are meaningful mainly to operations staff.

### 3. Schedule

Keep scheduling powerful, but optimize the default view for the signed-in counselor:

- today's view first
- fewer setup-heavy controls on first render
- stronger "schedule this client" and "open chart from appointment" paths
- simpler appointment creation flow

### 4. Charting

Elevate charting into a first-class working surface rather than a secondary area reached after navigation decisions. Charting should support fast movement between:

- current session
- recent note history
- treatment plan
- progress data
- assigned homework/forms

### 5. Tasks / Follow-up

Introduce a unified task-oriented surface for:

- notes due
- incomplete documentation
- outstanding form review
- portal actions needing counselor attention
- follow-up items from workflow recommendations

This should remove pressure from the dashboard to carry every kind of work signal.

### 6. Admin surfaces

Retain deeper admin capability, but isolate it from normal counselor usage. These surfaces should feel intentionally administrative rather than mixed into the main counselor flow.

## Content And Language Direction

Rewrite UI copy to favor counselor language over platform language.

Shift away from labels like:

- Operations Dashboard
- Workspace Studio
- Operations Studio
- Practice Operations
- Priority Queue
- Compliance Watch

Toward language like:

- Home
- Today's Care
- Notes to Complete
- Client Follow-up
- Practice Settings
- Portal Requests
- Documentation Status

Copy should be:

- plain-language
- role-aware
- supportive but professional
- specific about the next action

## Production Hardening Requirements

The redesign must remove visible trust-eroding product signals from normal staff paths:

- preview-environment language
- placeholder production tabs
- mock/demo records in live navigation flows
- unfinished empty shells presented as working product

Where a feature is not ready, it should be:

- hidden behind admin/development paths, or
- intentionally presented as unavailable with clear product language and no false promise

## Technical Direction

This redesign should not be delivered as a single visual reskin. It requires structural changes to the web app.

### Required technical outcomes

- Break the main app shell into clearer route-level or module-level boundaries.
- Reduce the size and responsibility of the largest UI files.
- Create a role-aware navigation model sourced from configuration rather than ad hoc conditional rendering.
- Create shared page-frame patterns for counselor home, list/detail flows, task surfaces, and admin surfaces.
- Preserve and extend surface telemetry through the shared surface registry and monitoring summary.
- Ensure new or renamed surfaces are represented on the monitoring page.

### Performance direction

- Split oversized bundles where appropriate.
- Lazy-load large secondary surfaces.
- Keep the initial counselor experience lightweight and fast.

## Monitoring And Security Constraints

Every phase of this redesign must preserve the following:

- all visible surfaces remain instrumented per `FULL-SURFACE-MONITORING.md`
- any new or renamed page, tab, workflow, or modal is added to the shared surface registry
- monitoring summary and monitoring page continue to represent the redesigned surfaces
- telemetry remains privacy-safe and low-cardinality
- auth, RBAC, and audit behavior remain compliant with `FULL-SECURITY-AND-AUDITING.md`
- portal, audit, and security data stay separated from general UI telemetry

## Phased Delivery Plan

### Phase 1. UX foundation and IA reset

- Define role-specific navigation trees.
- Define the counselor home surface.
- Rename top-level destinations and copy for counselor clarity.
- Decide which current surfaces become counselor-primary, admin-only, secondary, or hidden.
- Remove visible placeholder/demo experiences from primary staff paths.

### Phase 2. Counselor Home implementation

- Build the new counselor landing surface.
- Route counselor roles there by default.
- Add quick actions into clients, schedule, and charting.
- Instrument the new surface and add it to monitoring outputs.

### Phase 3. Navigation and shell refactor

- Rework the shell so counselor navigation is compact and obvious.
- Separate admin navigation from counselor navigation.
- Simplify header behavior and reduce non-essential chrome.
- Improve mobile and tablet behavior for day-to-day counselor use.

### Phase 4. Workflow consolidation

- Tighten handoffs between clients, schedule, charting, forms, and follow-up work.
- Introduce a task-oriented follow-up surface.
- Reduce duplicate entry points and ambiguous action labels.

### Phase 5. Admin surface isolation

- Move monitoring, operations, and setup concerns into clearly administrative areas.
- Preserve access for admin roles without letting those paths dominate the primary experience.

### Phase 6. UX hardening and production polish

- Accessibility pass
- empty-state and error-state pass
- copy consistency pass
- performance pass
- telemetry and monitoring verification pass

## Acceptance Criteria

The redesign effort should be considered successful when:

- counselor roles no longer land on an operations-centric default dashboard
- counselor primary navigation is short, role-appropriate, and understandable without training on internal platform structure
- placeholder, preview, and mock-oriented product signals are removed from normal counselor paths
- the main counselor flow between home, clients, schedule, and charting is direct and coherent
- admin and technical tools remain available for authorized users without cluttering counselor workflows
- all redesigned surfaces satisfy the monitoring plan requirements
- all redesigned flows continue to satisfy security and auditing requirements
- the UI feels trustworthy, focused, and production-ready to a non-technical counselor

## Immediate Next Slice

The highest-value first implementation slice is:

1. define the new role-aware navigation model
2. design and build the counselor home surface
3. route counselor roles there by default
4. remove operations/monitoring/admin destinations from counselor primary navigation

This slice will create the strongest visible shift in product posture with the least ambiguity.

## Out Of Scope For This Plan

- complete backend domain redesign
- changing canonical monitoring or security standards
- replacing the client portal concept
- removing advanced admin capabilities
- aesthetic-only redesign work disconnected from workflow simplification

## Success Metric Direction

The redesign should improve:

- time to first useful action after sign-in
- chart-open and note-completion flow efficiency
- successful completion of scheduling and documentation tasks
- reduction in navigation churn across counselor flows
- clarity of role-specific wayfinding
- perceived production trust and usability in counselor review sessions

## Summary

Faith Counseling already has meaningful workflow depth. The problem is not lack of capability. The problem is that the current UI still presents that capability through an operations-heavy, platform-centric frame.

This redesign plan shifts the product toward a simpler truth:

- counselors should feel guided
- administrators should feel empowered
- technical/monitoring depth should stay available without becoming the face of the product
