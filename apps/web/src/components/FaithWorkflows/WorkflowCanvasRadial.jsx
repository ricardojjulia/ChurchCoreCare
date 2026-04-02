/**
 * @fileoverview WorkflowCanvasRadial — Hub-and-spoke canvas view for Faithful Workflows.
 *
 * ## Visual concept
 *
 * This view renders the selected client's care recommendations as a radial hub-and-spoke
 * diagram inspired by mind-map and infographic layouts:
 *
 *   - The **hub** (centre circle) displays the client snapshot: name, urgency, trend, and
 *     the pending recommendation count. Its border colour mirrors the client's urgency level.
 *
 *   - Each active **recommendation category** is a satellite connected to the hub by a
 *     coloured SVG spoke. Category satellites are distributed evenly around the hub, with
 *     the Safety category always anchored at the 12-o'clock position (angle = -π/2).
 *
 *   - Clicking a satellite **expands** its recommendation cards inline below the diagram,
 *     using the shared `WorkflowNode` component unchanged. Non-selected satellites and their
 *     spokes fade to 35% opacity to draw the eye to the current selection.
 *
 *   - Safety spokes are solid and thicker (strokeWidth 3) to reinforce clinical priority.
 *     All other spokes use a dashed pattern at 35% opacity when another category is active.
 *
 * ## Coordinate system
 *
 * All geometry is defined in a **500 × 500 SVG coordinate space** (the `AREA` constant).
 * The SVG element uses `viewBox="0 0 500 500"` with `preserveAspectRatio="xMidYMid meet"`
 * so it scales proportionally to any container width. Satellite positions are expressed as
 * CSS percentages (`toPct`) derived from this coordinate space, so both the SVG lines and
 * the HTML satellites scale together as the container resizes.
 *
 * The container uses `aspectRatio: 1` so height always matches width, keeping the diagram
 * circular and preventing distortion on narrow panels.
 *
 * ## Responsive behaviour
 *
 * - Below 480px container width a notice is shown advising the user to switch to Classic view.
 * - The diagram itself still renders at smaller sizes; only the notice is cosmetic.
 *
 * ## Safety invariants preserved
 *
 * - Safety satellite is always at 12-o'clock regardless of total category count.
 * - The `WorkflowNode` component (used for expanded cards) enforces priority ≥ 9 lock.
 * - No engine, rules, or data logic is modified — this is a pure visual layer.
 *
 * @module WorkflowCanvasRadial
 */

import { useState, useRef, useEffect } from 'react';
import { Alert, Badge, Box, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import WorkflowNode from './WorkflowNode.jsx';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ORDER } from './engine/types.js';
import { useI18n } from '../../lib/i18nContext.jsx';

// ─── Geometry constants ──────────────────────────────────────────────────────
// All coordinates are expressed in the 500 × 500 SVG viewBox coordinate space.
// The SVG uses viewBox + preserveAspectRatio so the diagram scales proportionally.
// Satellite positions are expressed as CSS percentages derived from the same space
// via `toPct`, so HTML elements and SVG lines stay aligned at any container width.

const AREA  = 500; // SVG viewBox width = height (px, logical)
const CX    = AREA / 2; // 250 — hub centre x in SVG space
const CY    = AREA / 2; // 250 — hub centre y in SVG space
const HUB_R = 82;  // hub circle radius (px, SVG space)
const SPOKE = 195; // distance from hub centre to satellite centre (px, SVG space)

/**
 * Converts a coordinate in SVG space (0–500) to a CSS percentage string.
 * Used to position absolutely-placed HTML elements in sync with the SVG overlay.
 *
 * @param {number} coord - Coordinate value in SVG space (0–AREA).
 * @returns {string} CSS percentage string, e.g. `"50%"`.
 */
const toPct = (coord) => `${(coord / AREA) * 100}%`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Groups a flat recommendation array into `{ category, recs }` objects ordered
 * by `CATEGORY_ORDER` (Safety first, Spiritual last). Only categories that have
 * at least one recommendation are included.
 *
 * @param {import('./engine/types.js').Recommendation[]} recs
 * @returns {{ category: string, recs: import('./engine/types.js').Recommendation[] }[]}
 */
function groupByCategory(recs) {
  const map = {};
  for (const rec of recs) {
    if (!map[rec.category]) map[rec.category] = [];
    map[rec.category].push(rec);
  }
  return CATEGORY_ORDER
    .filter((cat) => map[cat]?.length > 0)
    .map((cat) => ({ category: cat, recs: map[cat] }));
}

/**
 * Computes per-satellite geometry for every active recommendation category.
 *
 * ## Angle distribution
 *
 * Satellites are distributed evenly around the hub at `360° / n` intervals.
 * The first group (always Safety, due to `CATEGORY_ORDER`) is placed at angle
 * `-π/2` (straight up, 12-o'clock). Subsequent groups advance clockwise.
 *
 * Formula: `angle[i] = -π/2 + i × (2π / n)`
 *
 * ## Spoke endpoints
 *
 * Each spoke line runs from just outside the hub circle edge (`HUB_R + 10`) to
 * just short of the satellite centre (`SPOKE - 72`), leaving a visual gap that
 * prevents the line from overlapping the satellite Paper border.
 *
 * ## CSS position vs. SVG coordinate alignment
 *
 * `leftPct` and `topPct` are the satellite centres expressed as CSS percentages
 * of the container size. Because the container uses `aspectRatio: 1` and the SVG
 * uses the same 500×500 coordinate space with `preserveAspectRatio="xMidYMid meet"`,
 * these percentages stay in perfect alignment with the SVG spoke endpoints at any
 * container width.
 *
 * @param {{ category: string, recs: import('./engine/types.js').Recommendation[] }[]} groups
 * @returns {Array<{
 *   category: string,
 *   color: string,
 *   isSafety: boolean,
 *   angle: number,
 *   svgCx: number, svgCy: number,
 *   leftPct: string, topPct: string,
 *   sx1: number, sy1: number,
 *   sx2: number, sy2: number,
 *   label: string,
 *   icon: string,
 *   recs: import('./engine/types.js').Recommendation[]
 * }>}
 */
function computeSatellites(groups) {
  const n = groups.length;
  return groups.map((group, i) => {
    // Evenly distribute angles, Safety anchored at -π/2 (top)
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const color = CATEGORY_COLORS[group.category] ?? 'gray';
    const satCx = CX + Math.cos(angle) * SPOKE;
    const satCy = CY + Math.sin(angle) * SPOKE;
    return {
      category: group.category,
      color,
      isSafety: group.category === 'safety',
      angle,
      // SVG coordinate space — used by SVG line endpoints
      svgCx: satCx,
      svgCy: satCy,
      // CSS percentage positions — align HTML satellites with SVG spokes
      leftPct: toPct(satCx),
      topPct:  toPct(satCy),
      // Spoke endpoints: hub edge → gap before satellite centre
      sx1: CX + Math.cos(angle) * (HUB_R + 10),
      sy1: CY + Math.sin(angle) * (HUB_R + 10),
      sx2: CX + Math.cos(angle) * (SPOKE  - 72),
      sy2: CY + Math.sin(angle) * (SPOKE  - 72),
      label: group.category.replace(/_/g, ' '),
      icon:  CATEGORY_ICONS[group.category] ?? '•',
      recs:  group.recs,
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders the expanded card list for a clicked satellite category.
 * Displayed below the radial hub area when a category is selected.
 *
 * Uses the shared `WorkflowNode` component so all action buttons, status controls,
 * and safety-lock enforcement remain identical to the Classic and Priority views.
 *
 * @param {object} props
 * @param {object} props.sat - Satellite descriptor from `computeSatellites`.
 * @param {string|undefined} props.selectedRecId - ID of the currently selected rec (for highlight).
 * @param {Function} props.onSelectRec - Called with the full rec when clicked.
 * @param {Function} props.onAction - Called with `(rec, actionType)`.
 * @param {Function} props.onStatusChange - Called with `(rec, newStatus)`.
 */
function ExpandedCategory({ sat, selectedRecId, onSelectRec, onAction, onStatusChange }) {
  return (
    <Box w="100%" maw={680} data-testid={`radial-expanded-${sat.category}`}>
      <Stack gap="xs">
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 3,
              height: 18,
              background: `var(--mantine-color-${sat.color}-5)`,
              borderRadius: 2,
            }}
          />
          <Text size="xs" fw={700} c={`${sat.color}.6`} tt="uppercase">
            {sat.icon} {sat.label}
          </Text>
          <Badge size="xs" color={sat.color} variant="light">
            {sat.recs.length}
          </Badge>
        </Group>

        {sat.recs.map((rec) => (
          <WorkflowNode
            key={rec.id}
            rec={rec}
            selected={selectedRecId === rec.id}
            onSelect={() => onSelectRec?.(rec)}
            onAction={(action) => onAction?.(rec, action)}
            onStatusChange={(status) => onStatusChange?.(rec, status)}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Radial Hub canvas view for the Faithful Workflows page.
 *
 * Renders the selected client's care recommendations as a hub-and-spoke diagram.
 * The client snapshot (name, urgency, trend, rec count) lives in the centre hub circle.
 * Each active recommendation category becomes a satellite connected to the hub by a
 * coloured SVG spoke. Clicking a satellite expands its recommendation cards below the hub.
 *
 * ## Props contract
 *
 * Props are **identical to `WorkflowCanvas`** — this component is a drop-in visual
 * alternative. `FaithWorkflowsPage` switches between canvases by rendering either
 * `<WorkflowCanvas>` or `<WorkflowCanvasRadial>` with the same prop set.
 *
 * ## Rendering approach
 *
 * - SVG overlay (`position: absolute`, `pointerEvents: none`) draws spoke lines.
 * - Hub circle and satellites are absolutely positioned HTML `Box` elements.
 * - All positions are expressed as CSS percentages derived from the 500×500 SVG
 *   coordinate space via `toPct`, so the layout scales with the container.
 * - The container uses `aspectRatio: 1` to keep the diagram circular.
 *
 * ## Interaction model
 *
 * 1. Click a satellite → that category's recommendation cards expand below the hub.
 * 2. Click the same satellite again → cards collapse.
 * 3. Clicking a `WorkflowNode` card → calls `onSelectRec` (opens the detail drawer).
 * 4. All status actions (mark complete, defer, hide) are available in the drawer.
 *
 * ## Safety invariants
 *
 * - Safety satellite is always rendered at the 12-o'clock position.
 * - `WorkflowNode` enforces the `priority >= SAFETY_LOCK_THRESHOLD` hide/defer lock.
 * - No engine, rule, or API logic is modified.
 *
 * @param {object} props
 * @param {object|null} props.client - Client record from the API (firstName, lastName, id).
 * @param {import('./engine/types.js').Recommendation[]} props.recommendations - Full rec list for this client.
 * @param {number} props.urgencyScore - 0–100 composite urgency score (used for hub colouring).
 * @param {import('./engine/types.js').UrgencyLevel} props.urgencyLevel - Urgency tier label.
 * @param {string} props.diagnosisSummary - Short diagnosis summary string, e.g. "MDD, GAD".
 * @param {import('./engine/types.js').TrendDirection} props.trend - Clinical trend direction.
 * @param {string|undefined} props.selectedRecId - ID of the recommendation currently open in the drawer.
 * @param {Function} props.onSelectRec - Called with the full `Recommendation` object when a card is clicked.
 * @param {Function} props.onAction - Called with `(rec, actionType)` for content-generating actions.
 * @param {Function} props.onStatusChange - Called with `(rec, newStatus, deferredUntil?)`.
 * @param {Function} [props.onToggleCategory] - Optional telemetry callback: `(category, isExpanding)`.
 */
export default function WorkflowCanvasRadial({
  client,
  recommendations,
  urgencyLevel,
  diagnosisSummary,
  trend,
  selectedRecId,
  onSelectRec,
  onAction,
  onStatusChange,
  onToggleCategory,
}) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ── Reset expansion when the client changes ─────────────────────────────────
  useEffect(() => {
    setSelectedCategory(null);
  }, [client?.id]);

  // ── Measure container so we can show the narrow-screen notice ───────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const visible      = (recommendations ?? []).filter((r) => r.status !== 'hidden');
  const pendingCount = visible.filter((r) => r.status === 'pending').length;
  const groups       = groupByCategory(visible);
  const satellites   = computeSatellites(groups);

  const URGENCY_COLORS = { critical: 'red', high: 'orange', moderate: 'yellow', routine: 'gray' };
  const TREND_ICONS    = { improving: '↑', stable: '→', declining: '↓', unknown: '' };
  const TREND_COLORS   = { improving: 'green', stable: 'gray', declining: 'red', unknown: 'gray' };
  const hubColor = URGENCY_COLORS[urgencyLevel] ?? 'gray';

  const isTooNarrow        = containerWidth < 480;
  const selectedSatellite  = satellites.find((s) => s.category === selectedCategory) ?? null;

  const handleSatelliteClick = (category) => {
    const opening = selectedCategory !== category;
    setSelectedCategory(opening ? category : null);
    onToggleCategory?.(category, opening);
  };

  // ── Hub diameter as percentage of container so it scales with the SVG ───────
  const HUB_DIAM_PCT = `${(HUB_R * 2 / AREA) * 100}%`;

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }} data-testid="workflow-canvas-radial">
      <Stack gap="md" p="md" align="center">

        {/* Narrow-screen notice */}
        {isTooNarrow && (
          <Alert color="blue" variant="light" w="100%">
            <Text size="sm">
              Switch to <strong>Classic</strong> view for a better experience on this screen width.
            </Text>
          </Alert>
        )}

        {visible.length === 0 ? (
          <Alert color="teal" variant="light" w="100%">
            <Text size="sm">{t('workflow.canvas.noRecs')}</Text>
          </Alert>
        ) : (
          <>
            {/* ── Radial hub area ─────────────────────────────────────────── */}
            <Box
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: AREA,
                aspectRatio: '1',
                flexShrink: 0,
              }}
            >
              {/* SVG spoke lines — drawn behind the hub and satellites */}
              <svg
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
                viewBox={`0 0 ${AREA} ${AREA}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {satellites.map((sat) => (
                  <line
                    key={sat.category}
                    x1={sat.sx1} y1={sat.sy1}
                    x2={sat.sx2} y2={sat.sy2}
                    stroke={`var(--mantine-color-${sat.color}-${sat.isSafety ? '6' : '4'})`}
                    strokeWidth={sat.isSafety ? 3 : 1.5}
                    strokeDasharray={sat.isSafety ? undefined : '5 4'}
                    strokeLinecap="round"
                    opacity={selectedCategory && selectedCategory !== sat.category ? 0.35 : 1}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />
                ))}
              </svg>

              {/* Hub circle — client snapshot lives here */}
              <Box
                style={{
                  position: 'absolute',
                  left: toPct(CX),
                  top:  toPct(CY),
                  width:  HUB_DIAM_PCT,
                  height: HUB_DIAM_PCT,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: 'var(--mantine-color-body)',
                  border: `3px solid var(--mantine-color-${hubColor}-5)`,
                  boxShadow: `0 0 0 6px var(--mantine-color-${hubColor}-1), 0 8px 32px rgba(0,0,0,0.08)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 8,
                  zIndex: 3,
                }}
              >
                <Badge color={hubColor} variant="filled" size="xs" mb={2}>
                  {urgencyLevel}
                </Badge>
                <Text fw={700} size="sm" lineClamp={2} style={{ lineHeight: 1.25 }}>
                  {client?.firstName ?? ''} {client?.lastName ?? ''}
                </Text>
                {diagnosisSummary && (
                  <Text
                    size="xs"
                    c="dimmed"
                    lineClamp={1}
                    mt={2}
                    style={{ fontSize: '0.6rem' }}
                  >
                    {diagnosisSummary}
                  </Text>
                )}
                <Group gap={3} mt={4} justify="center" wrap="nowrap">
                  <Badge color="blue" variant="light" size="xs">
                    {pendingCount} rec{pendingCount !== 1 ? 's' : ''}
                  </Badge>
                  {trend !== 'unknown' && (
                    <Badge
                      color={TREND_COLORS[trend]}
                      variant="dot"
                      size="xs"
                    >
                      {TREND_ICONS[trend]} {trend}
                    </Badge>
                  )}
                </Group>
              </Box>

              {/* Category satellites */}
              {satellites.map((sat) => {
                const isSelected = selectedCategory === sat.category;
                const pendingSatCount = sat.recs.filter((r) => r.status === 'pending').length;
                return (
                  <Box
                    key={sat.category}
                    role="button"
                    tabIndex={0}
                    aria-label={`${sat.label} — ${pendingSatCount} recommendations`}
                    aria-pressed={isSelected}
                    onClick={() => handleSatelliteClick(sat.category)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSatelliteClick(sat.category);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: sat.leftPct,
                      top:  sat.topPct,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 2,
                      cursor: 'pointer',
                      opacity: selectedCategory && !isSelected ? 0.55 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <Paper
                      withBorder
                      radius="xl"
                      px="xs"
                      py={5}
                      style={{
                        borderColor: `var(--mantine-color-${sat.color}-${isSelected ? '6' : '4'})`,
                        borderWidth: isSelected ? 2 : 1,
                        background: isSelected
                          ? `var(--mantine-color-${sat.color}-0)`
                          : 'var(--mantine-color-body)',
                        boxShadow: isSelected
                          ? `0 2px 12px var(--mantine-color-${sat.color}-2)`
                          : '0 1px 4px rgba(0,0,0,0.07)',
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                        userSelect: 'none',
                        minWidth: 110,
                      }}
                    >
                      <Stack gap={2} align="center">
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Text size="xs" style={{ lineHeight: 1 }}>{sat.icon}</Text>
                          <Text
                            size="xs"
                            fw={600}
                            tt="capitalize"
                            c={`${sat.color}.7`}
                            lineClamp={1}
                          >
                            {sat.label}
                          </Text>
                        </Group>
                        <Badge
                          size="xs"
                          color={sat.color}
                          variant={isSelected ? 'filled' : 'light'}
                        >
                          {pendingSatCount}
                        </Badge>
                      </Stack>
                    </Paper>
                  </Box>
                );
              })}
            </Box>

            {/* ── Expanded recommendation cards ──────────────────────────── */}
            {selectedSatellite && (
              <ExpandedCategory
                sat={selectedSatellite}
                selectedRecId={selectedRecId}
                onSelectRec={onSelectRec}
                onAction={onAction}
                onStatusChange={onStatusChange}
              />
            )}
          </>
        )}
      </Stack>
    </ScrollArea>
  );
}
