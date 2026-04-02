# Faithful Workflows — Visual Impact Upgrade

**Date:** 2026-04-01
**Parent plan:** `PLANS/FAITHFUL-WORKFLOWS.md` (Phases 1–5 complete)
**Target version:** 5.6.x (minor visual — no functional changes)
**Status:** ✅ COMPLETE (2026-04-01)
**Backup tag:** `backup/faith-workflows-visual-pre-upgrade`

---

## Goal

The engine, rules, AI conclusions, trend analysis, and persistence are all working correctly — no functional changes are required. The goal is to make the **WorkflowCanvas visualization more impactful** for the counselor, drawing attention to urgency, clinical hierarchy, and the relationship between the client snapshot and their care priorities in a way that the current linear card list does not.

The original screen must remain fully intact and testable in parallel.

---

## Backup Strategy

A git tag has been created at the current HEAD before any work begins:

```
backup/faith-workflows-visual-pre-upgrade
```

To restore to this exact state at any time:
```bash
git checkout backup/faith-workflows-visual-pre-upgrade
```

The original `WorkflowCanvas.jsx` and `WorkflowNode.jsx` are **not modified**. New view components are added alongside them.

---

## Architectural Approach — Parallel Views with a Variant Flag

### Why parallel, not replacement

- The original view is fully functional and proven in use.
- New views are experimental — visual impact must be validated against real counselor workflows.
- A flag lets the user (or counselor) switch instantly, including mid-session.
- No engine, no rules, no data-fetch logic changes at all.

### How the flag works

**Storage:** `localStorage` key `fw_view_variant` (per-browser, per-user, no server round-trip).

**Values:**
| Value | Component | Label |
|---|---|---|
| `classic` | `WorkflowCanvas.jsx` | Classic |
| `radial` | `WorkflowCanvasRadial.jsx` | Radial Hub |
| `priority` | `WorkflowCanvasPriority.jsx` | Priority Matrix |

**Where the picker lives:** In the `FaithWorkflowsPage.jsx` header group (right side, next to the title), rendered as a `SegmentedControl` (Mantine) or `Select`. Compact, two or three options. Defaults to `classic` on first load.

The picker is **not** inside WorkflowCanvas — it stays in the page so the canvas can be a pure rendering component.

**The switch is wired in `FaithWorkflowsPage.jsx`** with a single conditional:

```jsx
{variant === 'radial'
  ? <WorkflowCanvasRadial ... />
  : variant === 'priority'
    ? <WorkflowCanvasPriority ... />
    : <WorkflowCanvas ... />          // original, untouched
}
```

All three canvas components receive **identical props** — same `recommendations`, `client`, `urgencyLevel`, `trend`, `onSelectRec`, `onAction`, `onStatusChange`. The new views are drop-in visual alternatives to the existing canvas interface.

---

## New View 1 — Radial Hub (`WorkflowCanvasRadial.jsx`)

### Concept

Inspired by the hub-and-spoke infographic reference. The client snapshot card sits in the center. Category groups radiate outward as colored spokes. Each spoke terminates in a category node; clicking it expands an inline card list below the hub.

### Layout (SVG + absolute-positioned HTML)

```
                    ┌─────────────┐
                    │  🚨 SAFETY  │ ← category satellite (red)
                    └──────┬──────┘
                           │
   ┌──────────────┐        │        ┌──────────────┐
   │ 🟠 CLINICAL  │────────┼────────│ 🔵 SESSION   │
   └──────┬───────┘   ┌────┴────┐   └──────┬───────┘
          │           │  EMMA   │          │
          │           │   R.    │          │
   ┌──────┴───────┐   │CRITICAL │   ┌──────┴───────┐
   │ 🟣 SPIRITUAL │   │ ↓ TREND │   │ 🟢 MONITORING│
   └──────────────┘   └────┬────┘   └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ 🗂 COORD.   │
                    └─────────────┘
```

- Hub is a `Paper` circle (or rounded-rect) — 180px — containing client name, urgency badge, trend indicator, and pending rec count.
- Spokes are SVG `<line>` elements drawn in a `<svg>` overlay positioned `absolute` over the hub area.
- Category satellites are Mantine `Paper` chips sized to the category label + count badge.
- **Selecting a category** slides out an expanded card panel below (or alongside) the hub — renders the standard `WorkflowNode` cards for that category.
- Safety category is always rendered at the top spoke (12-o'clock position) and its spoke is thicker/red.
- The number of spokes adapts to the number of active categories (2–8). Spokes are distributed by angle: `360° / n`, safety forced to top.

### SVG connector approach

No React Flow or D3. Pure SVG overlay:
```jsx
<Box style={{ position: 'relative', width: hubAreaWidth, height: hubAreaHeight }}>
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    {spokes.map(({ x1, y1, x2, y2, color }) => (
      <line key={...} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={2} strokeDasharray="4 3" />
    ))}
  </svg>
  {/* hub + satellites positioned with CSS */}
</Box>
```

Spoke coordinates are computed from hub center + satellite center using `useRef` + `getBoundingClientRect` (or fixed math based on container size).

### Responsive fallback

On screens < 900px wide, the Radial view falls back to the Classic view automatically (passes a media-query check, shows a note: "Radial view requires more horizontal space").

---

## New View 2 — Priority Matrix (`WorkflowCanvasPriority.jsx`)

### Concept

A 2D visual canvas. Y-axis = urgency tier (Critical → High → Medium → Low). X-axis = category group. Each recommendation is a compact card placed in the matching cell. The result looks like a triage grid — counselors immediately see what is both urgent AND in which domain.

### Layout

```
           Safety   Clinical   Session   Monitoring   Spiritual
Critical  ┌──────┐  ┌──────┐
          │Emma  │  │MDD   │
          │ PHQ  │  │Goal  │
          └──────┘  └──────┘
High               ┌──────┐  ┌──────┐
                   │ Plan │  │ Hmwk │
                   └──────┘  └──────┘
Medium                        ┌──────┐
                               │Assess│
                               └──────┘
Low                                     ┌──────┐
                                        │Prayer│
                                        └──────┘
```

- Each cell is a `<td>` or absolute-positioned area.
- Recommendation mini-cards in cells are truncated to title + priority badge only; clicking opens the standard `RecommendationDrawer`.
- Safety column always leftmost. Spiritual column always rightmost with muted styling.
- Empty cells render as subtle dashed outlines (conveys "nothing critical here").
- Row labels are sticky on scroll (sticky first column).

### Value over Classic

- Shows at a glance: "this client has 3 critical safety items AND 2 high clinical items" without reading a vertical list.
- The spatial layout creates a mental map counselors can reference across sessions.

---

## Files to Create

```
apps/web/src/components/FaithWorkflows/
├── WorkflowCanvasRadial.jsx         ← NEW: hub-and-spoke radial view
├── WorkflowCanvasPriority.jsx       ← NEW: 2D priority matrix view
```

## Files to Modify (minimal)

| File | Change |
|---|---|
| `FaithWorkflowsPage.jsx` | Add `variant` state (localStorage), `SegmentedControl` in header, conditional canvas render |

## Files NOT modified

| File | Reason |
|---|---|
| `WorkflowCanvas.jsx` | Original — preserved exactly |
| `WorkflowNode.jsx` | Shared by all views — no changes |
| `RecommendationDrawer.jsx` | Shared — no changes |
| `ClientRankList.jsx` | No changes |
| `SafetyBanner.jsx` | No changes |
| `engine/**` | Zero engine changes |
| `App.jsx` | No changes |

---

## Implementation Phases

### Phase 6-A: Flag plumbing + variant picker (FaithWorkflowsPage.jsx)
Deliverables:
- `variant` state initialized from `localStorage.getItem('fw_view_variant') ?? 'classic'`
- `SegmentedControl` in page header (right side): "Classic | Radial | Priority"
- `onChange` persists to `localStorage` and updates state
- Conditional render: when `variant === 'classic'` → existing `WorkflowCanvas` (no change to classic path)
- Stub `WorkflowCanvasRadial` and `WorkflowCanvasPriority` that render a `<Text>Coming soon</Text>` placeholder
- Build must pass, classic path must be 100% unchanged

### Phase 6-B: Radial Hub view (`WorkflowCanvasRadial.jsx`)
Deliverables:
- Hub circle with client name, urgency badge, trend, pending rec count
- Spoke layout: SVG lines, category satellites distributed by angle
- Safety spoke always top, thicker, red color
- Click satellite → expand category card list (uses `WorkflowNode` unchanged)
- Responsive fallback to Classic at < 900px
- All `onSelectRec`, `onAction`, `onStatusChange` wired identically to Classic

### Phase 6-C: Priority Matrix view (`WorkflowCanvasPriority.jsx`)
Deliverables:
- 2D grid: rows = urgency tiers, columns = active categories
- Mini-card in each cell (title + priority badge, click → drawer)
- Sticky row labels
- Empty cells as subtle dashed outlines
- Spiritual column visually muted

### Phase 6-D: Polish + build verification
- Verify Classic path still passes all 51 engine tests (`npm test` in engine)
- Verify build output size delta is minimal (no new dependencies added)
- Verify variant picker is accessible (keyboard nav, aria-label)
- Update `docs/change-log.md` with v5.6.x entry

---

## Safety Invariants (apply to all views)

These are non-negotiable regardless of which view variant is active:

1. Safety nodes always rendered first / most prominent position in any layout
2. Safety nodes with `priority >= 9` cannot be hidden or deferred (enforced in `WorkflowNode` already)
3. Spiritual nodes always have "(Optional)" label
4. AI watermark always present on generated content
5. No view may suppress or reorder safety above non-safety

---

## What NOT to Change

- The rules engine (`engine/` directory) — zero changes
- The data fetching and caching logic in `FaithWorkflowsPage.jsx` — zero changes
- The `RecommendationDrawer.jsx` — shared, unchanged
- The `ClientRankList.jsx` — left panel unchanged
- Any API routes or DB schema
- The Classic canvas — left exactly as shipped

---

## Rollback

To return to the pre-upgrade state at any time:

```bash
git checkout backup/faith-workflows-visual-pre-upgrade
```

Or, if the upgrade has been merged and only the picker needs to be removed:
- Delete `WorkflowCanvasRadial.jsx` and `WorkflowCanvasPriority.jsx`
- Revert the 3-line change in `FaithWorkflowsPage.jsx`

---

## Decisions Made (2026-04-01)

1. **View order:** Radial Hub built first (Phase 6-B delivered). Priority Matrix is Phase 6-C (future).

2. **Picker style:** Floating `ActionIcon` (bottom-right of canvas panel, `position: absolute`). Shows `⊙` when in Classic (switches to Radial) and `≡` when in Radial (switches to Classic). Tooltip explains current view. No SegmentedControl in the header — keeps the header clean.

3. **Persist per-counselor on server?** localStorage only for now. Future `/v1/preferences` endpoint can pick this up.

4. **Animation budget:** No stroke-dashoffset animation added — keeps critical path clean.

## Open Questions

1. **Priority Matrix (Phase 6-C):** Build when Radial has been validated in use.

2. **Spoke animation on client select?** Nice-to-have — evaluate after real user feedback on Radial.
