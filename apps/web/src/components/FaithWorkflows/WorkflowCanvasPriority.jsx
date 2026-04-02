/**
 * @fileoverview WorkflowCanvasPriority — 2D Priority Matrix canvas view for Faithful Workflows.
 *
 * ## Visual concept
 *
 * This view renders the selected client's care recommendations as a triage grid:
 *
 *   - **Y-axis (rows):** Priority tier — Critical (P9–10), High (P7–8), Medium (P5–6), Low (P1–4).
 *   - **X-axis (columns):** Recommendation category, in `CATEGORY_ORDER` (Safety leftmost,
 *     Spiritual rightmost with muted styling).
 *
 * The grid lets a counselor instantly answer: "What is both urgent AND in which clinical domain?"
 * A recommendation sitting in the Critical row / Safety column demands immediate attention;
 * one in the Low row / Monitoring column can wait.
 *
 * ## Grid rendering approach
 *
 * All grid cells are rendered as a **flat array of absolutely-addressed `<Box>` elements**
 * with explicit `gridRow` and `gridColumn` CSS Grid properties. This avoids the React
 * fragment-inside-grid problem and keeps the rendering logic readable and testable.
 *
 * The grid container uses:
 *   `gridTemplateColumns: 140px repeat(n, minmax(160px, 1fr))`
 *
 * Column 1 is the sticky row-label cell (`position: sticky; left: 0`).
 * Columns 2…n+1 are one per active category.
 *
 * Only rows and columns that have at least one recommendation are rendered —
 * there are no phantom empty rows or columns. Empty individual cells are shown
 * as subtle dashed outlines to communicate "nothing here" without visual noise.
 *
 * ## Safety invariants preserved
 *
 * - Safety is always the leftmost category column.
 * - Spiritual is always the rightmost column and is visually muted.
 * - Spiritual mini-cards carry an "(opt)" badge per platform safety rules.
 * - Clicking a mini-card opens the shared `RecommendationDrawer` — full status
 *   controls and safety-lock enforcement remain identical to other canvas views.
 * - No engine, rules, or data logic is modified.
 *
 * @module WorkflowCanvasPriority
 */

import { Alert, Badge, Box, Group, Paper, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ORDER } from './engine/types.js';
import { useI18n } from '../../lib/i18nContext.jsx';

// ─── Priority tiers ───────────────────────────────────────────────────────────
/**
 * Maps individual recommendation `priority` values (integer 1–10) to a display
 * tier used as grid row labels and row colours.
 *
 * The `priority` field on each `Recommendation` is set by the rules engine based
 * on clinical urgency — 10 is the most urgent (e.g., active SI), 1 is the least
 * (e.g., a routine spiritual suggestion). These four tiers mirror the urgency
 * levels used for client-level scoring but apply at the individual recommendation
 * level:
 *
 *   - Critical (9–10): immediate clinical action required
 *   - High     (7–8):  address this session or imminently
 *   - Medium   (5–6):  address in the near term
 *   - Low      (1–4):  routine monitoring or optional enhancement
 *
 * @type {{ key: string, label: string, min: number, max: number, color: string }[]}
 */
const PRIORITY_TIERS = [
  { key: 'critical', label: 'Critical', min: 9, max: 10, color: 'red'    },
  { key: 'high',     label: 'High',     min: 7, max: 8,  color: 'orange' },
  { key: 'medium',   label: 'Medium',   min: 5, max: 6,  color: 'yellow' },
  { key: 'low',      label: 'Low',      min: 1, max: 4,  color: 'gray'   },
];

/**
 * Returns the `PRIORITY_TIERS` entry that contains the given recommendation priority.
 * Falls back to the "Low" tier if no exact match is found (should not happen for
 * well-formed engine output, but guards against future range additions).
 *
 * @param {number} priority - Recommendation priority value (1–10).
 * @returns {{ key: string, label: string, min: number, max: number, color: string }}
 */
function getTier(priority) {
  return PRIORITY_TIERS.find((t) => priority >= t.min && priority <= t.max) ?? PRIORITY_TIERS[3];
}

// ─── Mini recommendation card ─────────────────────────────────────────────────

/**
 * A compact recommendation card for use inside grid cells.
 *
 * Intentionally minimal — shows only the title and priority badge so that many
 * cards can coexist in a narrow cell without visual clutter. The full detail is
 * available in the `RecommendationDrawer` which opens on click via `onSelectRec`.
 *
 * A `Tooltip` on hover shows the recommendation's `summary` sentence so the
 * counselor can quickly assess relevance without opening the drawer.
 *
 * Spiritual recommendations are rendered at 80% opacity and carry an "(opt)" dot
 * badge to reinforce that they are optional — consistent with all other canvas views.
 *
 * @param {object} props
 * @param {import('./engine/types.js').Recommendation} props.rec
 * @param {boolean} props.selected - Whether this rec is currently open in the drawer.
 * @param {Function} props.onSelectRec - Called with the full rec to open the drawer.
 */
function MiniCard({ rec, selected, onSelectRec }) {
  const color   = CATEGORY_COLORS[rec.category] ?? 'gray';
  const dimmed  = rec.status === 'complete' || rec.status === 'deferred';
  const isSpiritual = rec.category === 'spiritual';

  return (
    <Tooltip
      label={rec.summary}
      withArrow
      multiline
      maw={240}
      position="top"
      openDelay={300}
    >
      <Paper
        withBorder
        radius="sm"
        px={8}
        py={5}
        onClick={() => onSelectRec?.(rec)}
        data-testid="priority-matrix-card"
        data-rule-id={rec.ruleId}
        style={{
          cursor: 'pointer',
          borderLeft: `3px solid var(--mantine-color-${color}-${isSpiritual ? '3' : '5'})`,
          opacity: dimmed ? 0.5 : isSpiritual ? 0.8 : 1,
          outline: selected ? `2px solid var(--mantine-color-${color}-4)` : 'none',
          outlineOffset: 1,
          transition: 'all 0.12s ease',
          minWidth: 0,
        }}
      >
        <Text size="xs" fw={600} lineClamp={2} style={{ lineHeight: 1.3 }}>
          {rec.status === 'complete' && '✓ '}
          {rec.title}
        </Text>
        <Group gap={4} mt={3} wrap="nowrap">
          <Badge size="xs" color={color} variant="light">
            P{rec.priority}
          </Badge>
          {isSpiritual && (
            <Badge size="xs" color="grape" variant="dot">
              opt
            </Badge>
          )}
        </Group>
      </Paper>
    </Tooltip>
  );
}

// ─── Client header strip ──────────────────────────────────────────────────────

/**
 * Compact horizontal client summary rendered above the priority matrix.
 * Mirrors the role of the `ClientSnapshot` card in the Classic view and the
 * hub circle in the Radial view — ensures the counselor always sees client
 * context regardless of which canvas variant is active.
 *
 * @param {object} props
 * @param {object|null} props.client
 * @param {import('./engine/types.js').UrgencyLevel} props.urgencyLevel
 * @param {string} props.diagnosisSummary
 * @param {import('./engine/types.js').TrendDirection} props.trend
 * @param {number} props.pendingCount - Number of pending (not complete/deferred/hidden) recs.
 */
function ClientHeader({ client, urgencyLevel, diagnosisSummary, trend, pendingCount }) {
  const URGENCY_COLORS = { critical: 'red', high: 'orange', moderate: 'yellow', routine: 'gray' };
  const TREND_ICONS    = { improving: '↑', stable: '→', declining: '↓', unknown: '~' };
  const TREND_COLORS   = { improving: 'green', stable: 'gray', declining: 'red', unknown: 'gray' };
  const color = URGENCY_COLORS[urgencyLevel] ?? 'gray';

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{ borderLeft: `4px solid var(--mantine-color-${color}-6)` }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="xs" align="center" wrap="nowrap">
          <Text fw={700} size="sm">
            {client?.firstName ?? ''} {client?.lastName ?? ''}
          </Text>
          <Badge color={color} variant="filled" size="xs">{urgencyLevel}</Badge>
          {trend !== 'unknown' && (
            <Badge color={TREND_COLORS[trend]} variant="dot" size="xs">
              {TREND_ICONS[trend]} {trend}
            </Badge>
          )}
          {diagnosisSummary && (
            <Text size="xs" c="dimmed">{diagnosisSummary}</Text>
          )}
        </Group>
        <Badge color="blue" variant="light" size="sm">
          {pendingCount} rec{pendingCount !== 1 ? 's' : ''}
        </Badge>
      </Group>
    </Paper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Priority Matrix canvas view for the Faithful Workflows page.
 *
 * Renders the selected client's care recommendations as a 2D triage grid where
 * counselors can immediately see both the urgency level and the clinical domain
 * of every active recommendation simultaneously.
 *
 * ## Grid structure
 *
 * ```
 *              Safety   Clinical   Session   Monitoring   Spiritual
 * Critical   [ P10 rec ]
 * High                  [ P7 rec ]  [ P7 rec ]
 * Medium                             [ P5 rec ]
 * Low                                           [ P3 rec ]  [ P2 opt ]
 * ```
 *
 * - Row 1 is the category header row.
 * - Rows 2…n are one per active priority tier.
 * - Column 1 is a sticky row-label column (Critical / High / Medium / Low badges).
 * - Columns 2…n are one per active category (in `CATEGORY_ORDER`).
 * - Empty cells render as dashed-border placeholders — they convey "nothing here"
 *   without removing the column, so the category context is always visible.
 *
 * ## Grid cell rendering
 *
 * All grid items are built as a flat array and rendered as direct children of a
 * single CSS Grid container. Each item carries explicit `gridRow` / `gridColumn`
 * CSS properties. This avoids the React Fragment-inside-grid gotcha and keeps the
 * build logic easy to follow and debug.
 *
 * ## Interaction model
 *
 * 1. Click a mini-card → calls `onSelectRec(rec)` → `RecommendationDrawer` opens.
 * 2. All status actions (mark complete, defer, hide, safety lock) live in the drawer.
 *    The Priority Matrix view itself is intentionally read-only to keep the grid clean.
 *
 * ## Safety invariants
 *
 * - Safety column is always leftmost (enforced by `CATEGORY_ORDER` filter).
 * - Spiritual column is always rightmost and visually muted.
 * - Spiritual mini-cards carry an "(opt)" badge.
 * - No engine, rules, or data logic is modified.
 *
 * @param {object} props
 * @param {object|null} props.client - Client record (firstName, lastName, id).
 * @param {import('./engine/types.js').Recommendation[]} props.recommendations - Full rec list.
 * @param {number} props.urgencyScore - 0–100 composite score (passed through to ClientHeader).
 * @param {import('./engine/types.js').UrgencyLevel} props.urgencyLevel - Client-level urgency tier.
 * @param {string} props.diagnosisSummary - Short diagnosis string shown in the header strip.
 * @param {import('./engine/types.js').TrendDirection} props.trend - Clinical trend direction.
 * @param {string|undefined} props.selectedRecId - ID of the rec currently open in the drawer.
 * @param {Function} props.onSelectRec - Called with the full `Recommendation` to open the drawer.
 * @param {Function} props.onAction - Passed through but not invoked directly by this view.
 * @param {Function} props.onStatusChange - Passed through but not invoked directly by this view.
 * @param {Function} [props.onToggleCategory] - Not used by this view; present for API compatibility.
 */
export default function WorkflowCanvasPriority({
  client,
  recommendations,
  urgencyLevel,
  diagnosisSummary,
  trend,
  selectedRecId,
  onSelectRec,
}) {
  const { t } = useI18n();

  const visible      = (recommendations ?? []).filter((r) => r.status !== 'hidden');
  const pendingCount = visible.filter((r) => r.status === 'pending').length;

  // Active categories in CATEGORY_ORDER — preserves Safety-first, Spiritual-last ordering
  const activeCats = CATEGORY_ORDER.filter((cat) => visible.some((r) => r.category === cat));

  // Active tiers — only rows that have at least one recommendation
  const activeTiers = PRIORITY_TIERS.filter((tier) =>
    visible.some((r) => r.priority >= tier.min && r.priority <= tier.max),
  );

  // Cell map: tierKey → categoryKey → Recommendation[]
  const cellMap = {};
  for (const rec of visible) {
    const tier = getTier(rec.priority);
    if (!cellMap[tier.key]) cellMap[tier.key] = {};
    if (!cellMap[tier.key][rec.category]) cellMap[tier.key][rec.category] = [];
    cellMap[tier.key][rec.category].push(rec);
  }

  // ── CSS Grid geometry ───────────────────────────────────────────────────────
  // Column 1 (140px, sticky): row-label badges — Critical / High / Medium / Low.
  // Columns 2…n+1 (minmax 160px, 1fr): one per active recommendation category.
  //
  // All grid items are built as a flat `gridItems` array and rendered as direct
  // children of a single CSS Grid container. Each item carries explicit `gridRow`
  // and `gridColumn` props — this is intentional: React Fragments as grid children
  // do not map to grid tracks correctly, and explicit addressing is easier to debug.
  const COL_LABEL = 140;
  const COL_CELL  = 160;
  const gridTemplateColumns = `${COL_LABEL}px repeat(${activeCats.length}, minmax(${COL_CELL}px, 1fr))`;

  // Flat array of all grid cells — rendered as direct CSS Grid children below.
  const gridItems = [];

  // Row 1 — corner spacer + category headers
  gridItems.push(
    <Box
      key="corner"
      style={{
        gridRow: 1,
        gridColumn: 1,
        padding: '8px 10px',
        background: 'var(--mantine-color-default-border)',
        borderRadius: '4px 0 0 0',
      }}
    />,
  );

  activeCats.forEach((cat, ci) => {
    const color = CATEGORY_COLORS[cat] ?? 'gray';
    const isSpiritual = cat === 'spiritual';
    gridItems.push(
      <Box
        key={`hdr-${cat}`}
        style={{
          gridRow: 1,
          gridColumn: ci + 2,
          padding: '7px 10px',
          background: `var(--mantine-color-${color}-${isSpiritual ? '0' : '1'})`,
          borderBottom: `2px solid var(--mantine-color-${color}-${isSpiritual ? '3' : '5'})`,
          opacity: isSpiritual ? 0.75 : 1,
        }}
      >
        <Stack gap={2}>
          <Group gap={4} wrap="nowrap">
            <Text size="xs" style={{ lineHeight: 1 }}>{CATEGORY_ICONS[cat]}</Text>
            <Text
              size="xs"
              fw={700}
              c={`${color}.7`}
              tt="uppercase"
              lineClamp={1}
            >
              {cat.replace(/_/g, ' ')}
            </Text>
          </Group>
          <Badge size="xs" color={color} variant="light">
            {visible.filter((r) => r.category === cat).length}
          </Badge>
        </Stack>
      </Box>,
    );
  });

  // Rows 2…n+1 — tier label + cells
  activeTiers.forEach((tier, ri) => {
    const gridRow = ri + 2;

    // Sticky row-label cell
    gridItems.push(
      <Box
        key={`lbl-${tier.key}`}
        style={{
          gridRow,
          gridColumn: 1,
          padding: '10px 12px',
          background: `var(--mantine-color-${tier.color}-0)`,
          borderRight: `3px solid var(--mantine-color-${tier.color}-5)`,
          display: 'flex',
          alignItems: 'flex-start',
          position: 'sticky',
          left: 0,
          zIndex: 1,
        }}
      >
        <Badge color={tier.color} variant="filled" size="sm">
          {tier.label}
        </Badge>
      </Box>,
    );

    // Data cells — one per active category
    activeCats.forEach((cat, ci) => {
      const cellRecs = cellMap[tier.key]?.[cat] ?? [];
      const isEmpty  = cellRecs.length === 0;
      const color    = CATEGORY_COLORS[cat] ?? 'gray';

      gridItems.push(
        <Box
          key={`${tier.key}-${cat}`}
          style={{
            gridRow,
            gridColumn: ci + 2,
            padding: isEmpty ? 4 : 6,
            minHeight: 64,
            background: isEmpty
              ? undefined
              : `var(--mantine-color-${color}-0)`,
            border: isEmpty
              ? '1px dashed var(--mantine-color-default-border)'
              : `1px solid var(--mantine-color-${color}-2)`,
            borderRadius: 4,
            margin: 2,
          }}
        >
          {!isEmpty && (
            <Stack gap={4}>
              {cellRecs.map((rec) => (
                <MiniCard
                  key={rec.id}
                  rec={rec}
                  selected={selectedRecId === rec.id}
                  onSelectRec={onSelectRec}
                />
              ))}
            </Stack>
          )}
        </Box>,
      );
    });
  });

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }} data-testid="workflow-canvas-priority">
      <Stack gap="md" p="md">

        {/* Client header strip */}
        <ClientHeader
          client={client}
          urgencyLevel={urgencyLevel}
          diagnosisSummary={diagnosisSummary}
          trend={trend}
          pendingCount={pendingCount}
        />

        {visible.length === 0 ? (
          <Alert color="teal" variant="light">
            <Text size="sm">{t('workflow.canvas.noRecs')}</Text>
          </Alert>
        ) : (
          <>
            {/* Legend */}
            <Group gap="xs" wrap="wrap">
              <Text size="xs" c="dimmed">Rows = priority tier</Text>
              <Text size="xs" c="dimmed">·</Text>
              <Text size="xs" c="dimmed">Columns = care category</Text>
              <Text size="xs" c="dimmed">·</Text>
              <Text size="xs" c="dimmed">Click any card to view details</Text>
            </Group>

            {/* Priority matrix grid */}
            <Box style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns,
                  gridTemplateRows: `auto repeat(${activeTiers.length}, auto)`,
                  minWidth: COL_LABEL + activeCats.length * COL_CELL,
                  gap: 0,
                }}
                data-testid="priority-matrix-grid"
              >
                {gridItems}
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </ScrollArea>
  );
}
