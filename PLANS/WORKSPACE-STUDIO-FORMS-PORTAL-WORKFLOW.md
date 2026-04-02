# WORKSPACE STUDIO FORMS + PORTAL WORKFLOW PLAN

<!-- markdownlint-disable MD029 MD032 -->

Status: ✅ COMPLETE
Prepared: March 28, 2026
Owners: Workspace Studio, Documents, Portal

## Goal

Implement a complete workflow so counselors can assign one or more forms to clients, clients can complete forms multiple times for progress tracking, submissions are protected in storage, and Workspace Studio exposes assignment + completion history in Documents & Inventories and Portal tabs.

## Requirements Mapping

1. Workspace Studio > Documents & Inventories:
- Select a client.
- Assign one or more forms.
- Assign timing: next session, future session, or scheduled recurring.
- Show table of previously completed forms by client.

2. Versioned form completion:
- A client can submit the same form multiple times.
- Every completed version is preserved.
- Submission payloads are protected in storage.

3. Workspace Studio > Portal:
- Support account management for existing client accounts.
- Add planning and implementation hooks for standard onboarding forms.
- Standard forms are auto-assigned when a portal account is created.

4. Public client portal surface:
- Served webpage for client access path and possible-client account request path.

## Canonical Data Model Additions

1. `form_catalog`
- One row per form template available for assignment.
- Includes `form_key`, `title`, `category`, `is_standard_on_signup`, `is_active`, `version_number`.

2. `form_assignments`
- One row per assignment event.
- Includes `client_id`, `form_key`, scheduling mode, due/session timestamp, recurrence rule, status, and counselor metadata.

3. `form_submissions`
- Append-only per completion instance.
- Includes `client_id`, `form_key`, `assignment_id` (optional), `submission_version`, encrypted answers payload, and score summary metadata.

4. `portal_registration_requests`
- Captures public "possible client" portal request metadata.

## API Additions

1. Forms catalog
- `GET /v1/forms/catalog`
- `POST /v1/forms/catalog` (admin/staff controlled)
- `PATCH /v1/forms/catalog`

2. Form assignments
- `GET /v1/forms/assignments?clientId=...`
- `POST /v1/forms/assignments`
- `PATCH /v1/forms/assignments`

3. Form submissions
- `GET /v1/forms/submissions?clientId=...&formKey=...`
- `POST /v1/forms/submissions`

4. Composite screen feed
- `GET /v1/forms/client-overview?clientId=...`

5. Public portal requests
- `POST /v1/portal/public-requests`

## UI Additions

1. New Workspace Studio tab content for Documents & Inventories
- Client picker.
- Multi-form assignment panel.
- Assignment scheduling controls.
- Active assignments table.
- Completed submissions history table.
- Launch selected form runner and save completion.

2. FormRunner completion integration
- Add completion callback contract.
- Preserve existing print flow.

3. Portal tab enhancement
- Display and manage standard-on-signup behavior through assigned forms visibility and account creation flow.

4. Public portal page
- `/portal` serves `portal.html`.
- Existing clients: access path.
- Possible clients: registration request form.

## Security & Privacy Controls

1. Protect form submissions with encrypted JSON payload storage.
2. Keep assignment metadata non-PHI where possible.
3. Preserve tenant scoping and role checks on all new endpoints.
4. Emit audit actions for create/read/update operations.
5. Keep telemetry low-cardinality and PHI-safe.

## Monitoring Coverage

Surface IDs used:
- `studio.documents` for Workspace Studio Documents & Inventories.
- `studio.portal` already in use for Portal tab.
- `portal` for public portal page interactions.

Minimum tracking:
- page/tab view
- load and action timing
- assignment and submission success/failure counts
- empty-state exposure

## Delivery Slices

Slice 1: Data + schema + query layer
- Add tables and query adapters.

Slice 2: API routes
- Add forms catalog, assignment, submission, and overview endpoints.

Slice 3: Workspace Studio UI
- Replace placeholder with full Documents & Inventories operational tab.

Slice 4: Portal public page
- Add `portal.html`, route mapping, and public request API.

Slice 5: Validation
- Web build validation.
- API syntax check.

## Implementation Status

- Completed: Slice 1
- Completed: Slice 2
- Completed: Slice 3
- Completed: Slice 4
- Completed: Slice 5

## Delivered Files (Initial Delivery)

1. Schema and query layer
- `apps/api/src/db/schema.sql`
- `apps/api/src/db/queries/formWorkflows.js`

2. API routes and workflow logic
- `apps/api/src/index.js`

3. Workspace Studio UI
- `apps/web/src/components/WorkspaceStudio/tabs/DocumentsStudioTab.jsx`
- `apps/web/src/components/WorkspaceStudio/WorkspaceStudioPage.jsx`
- `apps/web/src/components/Documents/FormRunner.jsx`
- `apps/web/src/components/Documents/DocumentsPage.jsx`
- `apps/web/src/components/Documents/formRegistry.js`

4. Public portal surface
- `apps/web/public/portal.html`
- `apps/web/public/portal.js`
- `apps/web/server.js`

5. Plan artifact
- `PLANS/WORKSPACE-STUDIO-FORMS-PORTAL-WORKFLOW.md`

## Acceptance Criteria

1. Counselor can assign a form with timing mode (next session/future/recurring).
2. Same client can submit the same form multiple times.
3. Submissions are listed with version and timestamp in history table.
4. Submission answers are stored encrypted.
5. Portal account creation auto-assigns standard-on-signup forms.
6. Public `/portal` page is accessible and accepts possible-client requests.
7. Workspace Studio Documents tab is fully functional (not placeholder).
