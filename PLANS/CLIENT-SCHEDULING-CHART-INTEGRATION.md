# Client + Scheduling + Chart Integration — Implementation Plan

**Date:** 2026-03-31
**Status:** Planned
**Target version:** 5.4.0 (minor — new UI surfaces, no breaking API changes)

---

## Feature Overview

Four connected improvements across three workspaces:

1. **Client Workspace — High-Touchpoint flag is inline-toggleable**
2. **Client Workspace — "Sessions" button per client shows full appointment history**
3. **Scheduling Workspace — Client session finder with note status indicators**
4. **Clinical Chart — accepts `initialClientId` prop for deep-link navigation**

---

## Feature 1: High-Touchpoint Toggle on Client List

### Current state
`highTouchpoint` is displayed as a grape badge when true. It can only be changed via the Quick Edit modal (ClientModal → ClientForm). There is no inline toggle in the list.

### Target state
Each client row shows the high-touchpoint badge as a **clickable toggle button**. One click flips the flag and PATCHes the server immediately. Optimistic update in the UI, rollback on error.

### What changes
- `apps/web/src/components/ClientsPage.jsx`
  - Replace the static badge with an `ActionIcon` or toggle `Badge` that calls `PATCH /api/v1/clients/:id` with `{ highTouchpoint: !current }`
  - Show a loading spinner on the badge while the PATCH is in-flight
  - On success: update local state (or re-fetch)
  - On failure: revert + show notification

### API
Already supported — `PATCH /v1/clients/:id` accepts `highTouchpoint` boolean. No API changes needed.

---

## Feature 2: "Sessions" Button per Client on Client Workspace

### Current state
Per-client buttons: Edit · Schedule · Quick Edit

### Target state
Per-client buttons: Edit · **Sessions** · Schedule · Quick Edit

"Sessions" opens a **Modal** listing all appointments for that client, newest first.

### Modal columns
| Date & Time | Type | Status | Counselor | Duration |
|---|---|---|---|---|

Status badges: scheduled (blue) · checked_in (teal) · completed (green) · cancelled (gray) · no_show (red)

### What changes
- `apps/web/src/components/ClientsPage.jsx`
  - Add `sessionsModal: { open: false, clientId: null, clientName: '' }` state
  - Add "Sessions" button per row
  - Add `<ClientSessionsModal>` component (new file or inline) that fetches `GET /api/v1/appointments?clientId=:id` on open and renders the table
  - Loading / empty / error states

### New component
`apps/web/src/components/ClientSessionsModal.jsx`
- Props: `clientId`, `clientName`, `opened`, `onClose`
- Fetches appointments filtered to `clientId`
- Shows table with appointment history

### API
`GET /api/v1/appointments?clientId=:id` — already supported (added in v5.3.2). No API changes needed.

---

## Feature 3: Scheduling Workspace — Client Session Finder with Note Status

### Current state
SchedulingPage has tabs: Calendar · Appointments · Waitlist · Reminders · Availability · Series

### Target state
New tab: **"Client Sessions"**

### Client Sessions tab behavior
1. Search/select a client (Select with search)
2. On selection: load all appointments for that client (newest first)
3. Display a table. For each appointment:
   - Date, type, status, counselor, duration, location
   - For **past appointments** (startsAt < now):
     - Fetch progress notes for that client and match by `appointmentId`
     - If locked note exists: badge `Notes Filed` (teal) + **"View Chart"** button
     - If draft note exists: badge `Draft — Pending Sign-off` (yellow) + **"View Chart"** button
     - If no note: badge `No Notes` (red/gray)
   - For **future/scheduled**: badge `Upcoming`, no note status needed
4. **"View Chart"** button navigates to Clinical Chart with the client pre-selected and the Session Notes tab active

### What changes
- `apps/web/src/components/SchedulingPage.jsx`
  - Add `'clientSessions'` to tab list
  - Add `ClientSessionsPanel` sub-component (fetches appointments + notes for selected client)
  - Receives `clients` prop and `onViewChart(clientId)` callback from parent
- `apps/web/src/App.jsx`
  - Add `clinicalChartInitialClientId` state (string | null)
  - Add handler `handleOpenClinicalChart(clientId)` — sets `currentView = 'clinical'` and `clinicalChartInitialClientId = clientId`
  - Pass `onViewChart={handleOpenClinicalChart}` to `SchedulingPage`
  - Pass `initialClientId={clinicalChartInitialClientId}` to `ClinicalChartPage`
  - Clear `clinicalChartInitialClientId` when navigating away from `'clinical'`

### Note status resolution (frontend, no new API)
- Fetch `GET /api/v1/clients/:id/progress-notes` for the selected client
- Group notes by `appointmentId`
- For each past appointment, look up notes by `appointment.id`:
  - Has a note with `locked: true` → "Notes Filed"
  - Has a note with `locked: false` → "Draft — Pending Sign-off"
  - No note → "No Notes"

---

## Feature 4: Clinical Chart — Pre-select Client via Prop

### Current state
`ClinicalChartPage` manages its own `selectedClientId` state, initialized to `''`. No external pre-selection.

### Target state
`ClinicalChartPage` accepts an optional `initialClientId` prop. If provided, the client selector is pre-populated on mount.

### What changes
- `apps/web/src/components/ClinicalChart/ClinicalChartPage.jsx`
  - Add `initialClientId = ''` prop
  - Initialize `useState(initialClientId)` instead of `useState('')`
  - Use `useEffect` to update if `initialClientId` changes (deep-link support)
- `apps/web/src/App.jsx`
  - Add `clinicalChartInitialClientId` state (cleared on navigate away from `'clinical'`)
  - Pass to `ClinicalChartPage`

---

## Scope of Changes Summary

### New files
```
apps/web/src/components/ClientSessionsModal.jsx
```

### Modified files
| File | Change |
|---|---|
| `apps/web/src/components/ClientsPage.jsx` | High-touchpoint toggle + Sessions button |
| `apps/web/src/components/ClientSessionsModal.jsx` | New — appointment history modal |
| `apps/web/src/components/SchedulingPage.jsx` | New "Client Sessions" tab with note status |
| `apps/web/src/components/ClinicalChart/ClinicalChartPage.jsx` | Accept `initialClientId` prop |
| `apps/web/src/App.jsx` | `clinicalChartInitialClientId` state + handler + prop pass-through |
| `packages/i18n/src/index.js` | New keys for sessions modal + note status labels |

### No API changes required
All needed data is already available:
- `PATCH /v1/clients/:id` — high-touchpoint toggle
- `GET /v1/appointments?clientId=:id` — client appointment history
- `GET /v1/clients/:id/progress-notes` — note status per appointment

---

## Implementation Order

1. `ClinicalChartPage` prop + App.jsx wiring (shortest, unblocks navigation from scheduling)
2. High-touchpoint toggle on ClientsPage (self-contained)
3. `ClientSessionsModal` + Sessions button on ClientsPage
4. Scheduling "Client Sessions" tab + note status + View Chart navigation
5. i18n keys throughout
6. Build + docs + version bump

---

## Out of Scope

- Inline note creation from the Scheduling tab (user navigates to Clinical Chart for that)
- Appointment-level note creation shortcut (future — requires deeper composer integration)
- Note status on the Calendar view (requires significant SchedulingPage calendar rework)
