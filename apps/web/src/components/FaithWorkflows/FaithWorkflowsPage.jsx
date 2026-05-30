import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ActionIcon, Alert, Box, Button, Group, Loader, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useI18n } from '../../lib/i18nContext.jsx';
import SafetyBanner from './SafetyBanner.jsx';
import ClientRankList from './ClientRankList.jsx';
import WorkflowCanvas from './WorkflowCanvas.jsx';
import WorkflowCanvasRadial from './WorkflowCanvasRadial.jsx';
import WorkflowCanvasPriority from './WorkflowCanvasPriority.jsx';
import RecommendationDrawer from './RecommendationDrawer.jsx';
import { runWorkflow, buildClientRankEntry, buildLightweightRankEntry } from './engine/runWorkflow.js';
import { getMockClientData, MOCK_CLIENTS } from './engine/mockData.js';
import { applyPersistedStates } from './engine/applyPersistedStates.js';
import { renderCareSummaryHtml } from './engine/contentTemplates.js';

// ─── View variant metadata ────────────────────────────────────────────────────

const VARIANT_ICONS = {
  classic:  '≡',
  radial:   '⊙',
  priority: '⊞',
};

const VARIANT_COLORS = {
  classic:  'gray',
  radial:   'blue',
  priority: 'violet',
};

const VARIANT_LABELS = {
  classic:  'Classic List — click for Radial Hub',
  radial:   'Radial Hub — click for Priority Matrix',
  priority: 'Priority Matrix — click for Classic List',
};

const FAITH_WORKFLOW_DEMO_STORAGE_KEY = 'faith_workflows.demo_mode';
const URGENCY_RANK = { routine: 0, moderate: 1, high: 2, critical: 3 };
const OPERATIONAL_URGENCY_SCORE_FLOOR = { moderate: 45, critical: 85 };

function readOptionalBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

function isFaithWorkflowDemoEnabled() {
  try {
    const stored = readOptionalBoolean(window.localStorage.getItem(FAITH_WORKFLOW_DEMO_STORAGE_KEY));
    if (stored !== null) return stored;
  } catch {
    // localStorage is optional for this feature flag
  }

  return readOptionalBoolean(import.meta.env?.VITE_ENABLE_FAITH_WORKFLOWS_DEMO) ?? false;
}

function mergeOperationalSignal(current, nextLevel, reasonChip) {
  if (!nextLevel || !reasonChip) return current ?? null;
  const existing = current ?? { urgencyLevel: nextLevel, reasonChips: [] };
  const urgencyLevel = (URGENCY_RANK[nextLevel] ?? 0) > (URGENCY_RANK[existing.urgencyLevel] ?? 0)
    ? nextLevel
    : existing.urgencyLevel;
  const reasonChips = existing.reasonChips.includes(reasonChip)
    ? existing.reasonChips
    : [...existing.reasonChips, reasonChip];
  return { urgencyLevel, reasonChips };
}

function applyOperationalUrgency(entry, operationalSignal) {
  if (!operationalSignal?.urgencyLevel) return entry;
  if ((URGENCY_RANK[operationalSignal.urgencyLevel] ?? 0) <= (URGENCY_RANK[entry.urgencyLevel] ?? 0)) {
    if (!operationalSignal.reasonChips?.length) return entry;
    const mergedReasonChips = [...new Set([...(operationalSignal.reasonChips ?? []), ...(entry.topReasonChips ?? [])])].slice(0, 3);
    return { ...entry, topReasonChips: mergedReasonChips };
  }

  return {
    ...entry,
    urgencyLevel: operationalSignal.urgencyLevel,
    urgencyScore: Math.max(entry.urgencyScore ?? 0, OPERATIONAL_URGENCY_SCORE_FLOOR[operationalSignal.urgencyLevel] ?? entry.urgencyScore ?? 0),
    topReasonChips: [...new Set([...(operationalSignal.reasonChips ?? []), ...(entry.topReasonChips ?? [])])].slice(0, 3),
  };
}

/**
 * Fetches enriched client workflow data from the API.
 * Falls back to mock data if the client ID is a mock ID.
 */
async function fetchClientWorkflowData(clientId, demoModeEnabled) {
  // Use mock data for demo clients
  const mockData = demoModeEnabled ? getMockClientData(clientId) : null;
  if (mockData) return mockData;

  // Parallel fetch of all data sources
  const [
    clientRes,
    diagnosesRes,
    notesRes,
    planRes,
    faithRes,
    appointmentsRes,
    assessmentsRes,
    homeworkRes,
    referralsRes,
  ] = await Promise.allSettled([
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}`,                    { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/diagnoses`,          { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/progress-notes`,     { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/treatment-plan`,     { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/faith-profile`,      { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/appointments?clientId=${encodeURIComponent(clientId)}`,      { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/forms/client-overview?clientId=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/forms/assignments?clientId=${encodeURIComponent(clientId)}&status=pending`, { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/v1/faith/referral-coordination?clientId=${encodeURIComponent(clientId)}`, { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
  ]);

  const val = (settled) => settled.status === 'fulfilled' ? settled.value : null;

  const clientData = val(clientRes);

  // The client-overview endpoint returns `submissions` (all form submissions for the client).
  // Map each to the shape the rules engine expects:
  //   inventoryName / title  → for getLatestAssessment name matching (e.g. 'PHQ-9', 'GAD-7')
  //   score                  → numeric score value
  //   scoredAt / completedAt → ISO date string for recency comparisons
  //   item9Score             → PHQ-9 question 9 (suicidal ideation) from responses.selfHarm
  const rawSubmissions = val(assessmentsRes)?.submissions ?? [];
  const assessments = rawSubmissions
    .filter((sub) => sub.scoreValue != null)
    .map((sub) => ({
      ...sub,
      inventoryName: sub.formTitle ?? sub.formKey ?? '',
      title: sub.formTitle ?? sub.formKey ?? '',
      score: sub.scoreValue != null ? Number(sub.scoreValue) : null,
      scoredAt: sub.submittedAt ?? null,
      completedAt: sub.submittedAt ?? null,
      item1Score: sub.responses?.phq1 != null ? Number(sub.responses.phq1) : null,
      item2Score: sub.responses?.phq2 != null ? Number(sub.responses.phq2) : null,
      item3Score: sub.responses?.phq3 != null ? Number(sub.responses.phq3) : null,
      item4Score: sub.responses?.phq4 != null ? Number(sub.responses.phq4) : null,
      item5Score: sub.responses?.phq5 != null ? Number(sub.responses.phq5) : null,
      item6Score: sub.responses?.phq6 != null ? Number(sub.responses.phq6) : null,
      item7Score: sub.responses?.phq7 != null ? Number(sub.responses.phq7) : null,
      item8Score: sub.responses?.phq8 != null ? Number(sub.responses.phq8) : null,
      item9Score: sub.responses?.phq9 != null ? Number(sub.responses.phq9)
                : sub.responses?.item9Score ?? sub.responses?.selfHarm ?? null,
    }));

  return {
    client: clientData?.item ?? clientData ?? { id: clientId },
    diagnoses: val(diagnosesRes)?.items ?? [],
    progressNotes: val(notesRes)?.items ?? [],
    treatmentPlan: val(planRes)?.item ?? val(planRes) ?? null,
    faithProfile: val(faithRes)?.item ?? val(faithRes) ?? null,
    appointments: val(appointmentsRes)?.items ?? [],
    assessments,
    homeworkPending: val(homeworkRes)?.items ?? [],
    referrals: val(referralsRes)?.items ?? [],
    status: 'ready',
    errorMessage: null,
  };
}

/**
 * Load persisted recommendation states for a real client from the API.
 * Returns a map of ruleId → status for merging into runWorkflow output.
 * Mock clients skip this — they always start fresh.
 */
async function fetchPersistedStates(clientId) {
  if (clientId.startsWith('mock-')) return {};
  try {
    const res = await fetch(
      `/api/v1/workflows/recommendations/state?clientId=${encodeURIComponent(clientId)}`,
      { credentials: 'include' },
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const s of data.states ?? []) {
      map[s.ruleId] = { status: s.status, deferredUntil: s.deferredUntil ?? null, stateId: s.id };
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Persist a status change for a recommendation to the API.
 * Silently no-ops for mock clients.
 */
async function persistStateChange(clientId, ruleId, status, deferredUntil = null) {
  if (clientId.startsWith('mock-')) return;
  try {
    await fetch('/api/v1/workflows/recommendations/state', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ruleId, status, deferredUntil }),
    });
  } catch {
    // Non-fatal: UI state is already updated optimistically
  }
}

/**
 * Persist multiple status changes in one API call.
 * Silently no-ops for mock clients.
 */
async function persistBatchStateChange(clientId, rules) {
  if (clientId.startsWith('mock-')) return;
  try {
    await fetch('/api/v1/workflows/recommendations/batch', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, rules }),
    });
  } catch {
    // Non-fatal: UI state is already updated optimistically
  }
}

/**
 * Fetch the audit history of state transitions for a single recommendation rule.
 * Returns [] on any error or for mock clients.
 */
async function fetchRecommendationHistory(clientId, ruleId) {
  if (clientId.startsWith('mock-')) return [];
  try {
    const url = `/api/v1/workflows/recommendations/history?clientId=${encodeURIComponent(clientId)}&ruleId=${encodeURIComponent(ruleId)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.history ?? [];
  } catch {
    return [];
  }
}

/**
 * Faithful Workflows — main three-panel page.
 *
 * Props:
 *   clients                — basic client list from App.jsx (already loaded)
 *   currentUser            — session user
 *   sharedOperationsSummary — canonical operations-summary payload for counts and urgency overlays
 */
export default function FaithWorkflowsPage({ clients = [], currentUser, sharedOperationsSummary = null }) {
  const { t } = useI18n();
  const demoModeEnabled = useMemo(() => isFaithWorkflowDemoEnabled(), []);

  // ─── Canvas view variant ─────────────────────────────────────────────────
  const [variant, setVariant] = useState(() => {
    try { return localStorage.getItem('fw_view_variant') ?? 'classic'; } catch { return 'classic'; }
  });
  const VARIANTS = ['classic', 'radial', 'priority'];
  const cycleVariant = useCallback(() => {
    setVariant((v) => {
      const next = VARIANTS[(VARIANTS.indexOf(v) + 1) % VARIANTS.length];
      try { localStorage.setItem('fw_view_variant', next); } catch {}
      return next;
    });
  }, []);

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  // Cache of enriched ClientWorkflowData keyed by clientId
  const [dataCache, setDataCache] = useState({});
  // Persisted rec status overrides keyed by ruleId — loaded from API, updated optimistically
  // Shape: { [ruleId]: { status, deferredUntil, stateId } }
  const [persistedStates, setPersistedStates] = useState({});
  // Loading state per clientId
  const [loadingSet, setLoadingSet] = useState(new Set());
  const [loadError, setLoadError] = useState(null);

  const operationalSignalsByClient = useMemo(() => {
    const signals = new Map();
    const register = (clientId, urgencyLevel, reasonChip) => {
      if (!clientId) return;
      signals.set(clientId, mergeOperationalSignal(signals.get(clientId), urgencyLevel, reasonChip));
    };

    const noteGapItems = Array.isArray(sharedOperationsSummary?.complianceWatch?.noteGapItems)
      ? sharedOperationsSummary.complianceWatch.noteGapItems
      : [];
    for (const item of noteGapItems) {
      const days = Number(item?.daysWithoutNote ?? 0);
      if (days >= 7) register(item.clientId, 'critical', 'Note gap 7+d');
      else if (days >= 3) register(item.clientId, 'moderate', 'Note gap 3+d');
    }

    const unscheduledClientItems = Array.isArray(sharedOperationsSummary?.clientsBox?.unscheduledClientItems)
      ? sharedOperationsSummary.clientsBox.unscheduledClientItems
      : [];
    for (const item of unscheduledClientItems) {
      if (item?.highTouchpoint) register(item.clientId, 'critical', 'High touchpoint unscheduled');
    }

    const outstandingAssignmentItems = Array.isArray(sharedOperationsSummary?.complianceWatch?.outstandingAssignments?.items)
      ? sharedOperationsSummary.complianceWatch.outstandingAssignments.items
      : [];
    for (const item of outstandingAssignmentItems) {
      register(item?.clientId, 'moderate', 'Assigned work pending');
    }

    return signals;
  }, [sharedOperationsSummary]);

  // ─── Build client rank entries from basic list + cached enriched data ──────
  const rankEntries = useMemo(() => {
    const allClients = [
      ...(demoModeEnabled ? MOCK_CLIENTS.map((m) => m.client) : []),
      ...clients.filter((c) => !c.id.startsWith('mock-')),
    ];

    return allClients
      .map((c) => {
        const cached = dataCache[c.id];
        if (cached) {
          const entry = buildClientRankEntry(cached);
          const recs = applyPersistedStates(entry.recommendations, persistedStates, c.id === selectedClientId);
          const enrichedEntry = { ...entry, recommendations: recs, recommendationCount: recs.filter((r) => r.status === 'pending').length };
          return applyOperationalUrgency(enrichedEntry, operationalSignalsByClient.get(c.id));
        }
        return applyOperationalUrgency(buildLightweightRankEntry(c), operationalSignalsByClient.get(c.id));
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [clients, dataCache, demoModeEnabled, operationalSignalsByClient, persistedStates, selectedClientId]);

  const localUrgencyCounts = useMemo(() => {
    const counts = { critical: 0, moderate: 0, routine: 0 };
    for (const e of rankEntries) {
      if (e.urgencyLevel === 'critical') counts.critical++;
      else if (e.urgencyLevel === 'high' || e.urgencyLevel === 'moderate') counts.moderate++;
      else counts.routine++;
    }
    return counts;
  }, [rankEntries]);

  const urgencyCounts = useMemo(() => {
    const sharedUrgencyCounts = sharedOperationsSummary?.faithfulWorkflowCounts;
    if (!sharedUrgencyCounts) return localUrgencyCounts;
    return {
      critical: Number(sharedUrgencyCounts.critical ?? 0),
      moderate: Number(sharedUrgencyCounts.moderate ?? 0),
      routine: Number(sharedUrgencyCounts.routine ?? 0),
    };
  }, [localUrgencyCounts, sharedOperationsSummary]);

  // ─── Selected client data ─────────────────────────────────────────────────
  const selectedEntry = rankEntries.find((e) => e.clientId === selectedClientId) ?? null;
  const selectedClientData = selectedClientId ? dataCache[selectedClientId] : null;

  // ─── Load enriched data + persisted states when a client is selected ───────
  useEffect(() => {
    if (!selectedClientId) return;
    if (dataCache[selectedClientId]) return;
    if (loadingSet.has(selectedClientId)) return;

    setLoadingSet((prev) => new Set([...prev, selectedClientId]));
    setLoadError(null);

    Promise.all([
      fetchClientWorkflowData(selectedClientId, demoModeEnabled),
      fetchPersistedStates(selectedClientId),
    ])
      .then(([data, states]) => {
        setDataCache((prev) => ({ ...prev, [selectedClientId]: data }));
        setPersistedStates((prev) => ({ ...prev, ...states }));
      })
      .catch((err) => {
        setLoadError(err.message ?? 'Unable to load client data');
      })
      .finally(() => {
        setLoadingSet((prev) => { const next = new Set(prev); next.delete(selectedClientId); return next; });
      });
  }, [selectedClientId, dataCache, demoModeEnabled, loadingSet]);

  // Pre-load mock clients on mount
  useEffect(() => {
    if (!demoModeEnabled) return;
    MOCK_CLIENTS.forEach((m) => {
      const id = m.client.id;
      if (!dataCache[id]) {
        setDataCache((prev) => ({ ...prev, [id]: m }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoModeEnabled]);

  // ─── Derived recommendations for selected client ──────────────────────────
  const recommendations = useMemo(() => {
    if (!selectedClientData) return [];
    const recs = runWorkflow(selectedClientData);
    return applyPersistedStates(recs, persistedStates, true);
  }, [selectedClientData, persistedStates]);

  // ─── Track recommendation surface count per client (for telemetry) ──────────
  const lastSurfacedRef = useRef(null);

  // Emit telemetry when the recommendations list changes for the selected client
  useEffect(() => {
    if (!selectedClientId || recommendations.length === 0) return;

    const key = `${selectedClientId}:${recommendations.length}`;
    if (lastSurfacedRef.current === key) return;
    lastSurfacedRef.current = key;

  }, [selectedClientId, recommendations]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectClient = useCallback((clientId) => {
    setSelectedClientId(clientId);
    setSelectedRec(null);
    closeDrawer();
  }, [closeDrawer]);

  const handleSelectRec = useCallback((rec) => {
    setSelectedRec(rec);
    openDrawer();
  }, [openDrawer]);

  const handleStatusChange = useCallback((rec, status, deferredUntil = null) => {
    // Optimistic UI update
    setPersistedStates((prev) => ({
      ...prev,
      [rec.ruleId]: { status, deferredUntil, stateId: prev[rec.ruleId]?.stateId ?? null },
    }));
    // Update the drawer's selected rec if it's the same one
    if (selectedRec?.id === rec.id) {
      setSelectedRec((r) => r ? { ...r, status } : r);
    }
    // If hidden, close drawer
    if (status === 'hidden' && selectedRec?.id === rec.id) {
      closeDrawer();
      setSelectedRec(null);
    }
    // Persist to API
    persistStateChange(selectedClientId, rec.ruleId, status, deferredUntil);
  }, [selectedRec, closeDrawer, selectedClientId]);

  const handleAction = useCallback((rec, actionType) => {
    if (actionType === 'mark_complete') {
      handleStatusChange(rec, 'complete');
    } else if (actionType === 'hide') {
      handleStatusChange(rec, 'hidden');
    } else {
      // For defer and content-generating actions, open the drawer
      setSelectedRec(rec);
      openDrawer();
    }
  }, [handleStatusChange, openDrawer]);

  const handleShowMoreClients = useCallback(() => {
  }, []);

  const handleToggleCategory = useCallback(() => {
  }, []);

  const handleBulkMarkReviewed = useCallback(() => {
    if (!selectedClientId) return;
    const pending = recommendations.filter((r) => r.status === 'pending');
    if (pending.length === 0) return;
    // Optimistic update
    setPersistedStates((prev) => {
      const next = { ...prev };
      for (const rec of pending) {
        next[rec.ruleId] = { status: 'complete', deferredUntil: null, stateId: prev[rec.ruleId]?.stateId ?? null };
      }
      return next;
    });
    persistBatchStateChange(selectedClientId, pending.map((r) => ({ ruleId: r.ruleId, status: 'complete' })));
  }, [selectedClientId, recommendations]);

  const handleExport = useCallback(() => {
    if (!selectedClientData || !selectedClientId) return;
    const html = renderCareSummaryHtml(selectedClientData, recommendations);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }, [selectedClientData, recommendations, selectedClientId]);

  const isLoadingSelected = selectedClientId && loadingSet.has(selectedClientId);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Stack gap={0} style={{ height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }} data-testid="faith-workflows-page">
      {/* Page header */}
      <Box p="md" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>{t('workflow.title')}</Title>
            <Text c="dimmed" size="sm">{t('workflow.subtitle')}</Text>
          </div>

          <Group gap="xs">
            {/* Bulk action — only visible when a client is selected and has pending recs */}
            {selectedClientId && recommendations.filter((r) => r.status === 'pending').length > 0 && (
              <Tooltip label="Mark all pending as reviewed" withArrow position="bottom">
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  onClick={handleBulkMarkReviewed}
                >
                  Mark all reviewed
                </Button>
              </Tooltip>
            )}

            {/* Export — only visible when a client is selected */}
            {selectedClientId && (
              <Tooltip label="Print / export care summary" withArrow position="bottom">
                <ActionIcon
                  size="lg"
                  variant="light"
                  color="gray"
                  radius="xl"
                  onClick={handleExport}
                  aria-label="Print care summary"
                >
                  <Text size="sm" style={{ lineHeight: 1 }}>⎙</Text>
                </ActionIcon>
              </Tooltip>
            )}

            {/* View picker */}
            <Tooltip label={VARIANT_LABELS[variant]} withArrow position="bottom">
              <ActionIcon
                size="lg"
                variant="light"
                color={VARIANT_COLORS[variant]}
                radius="xl"
                onClick={cycleVariant}
                aria-label={VARIANT_LABELS[variant]}
              >
                <Text size="sm" style={{ lineHeight: 1 }}>
                  {VARIANT_ICONS[variant]}
                </Text>
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Safety banner — always visible */}
      <Box style={{ flexShrink: 0 }}>
        <SafetyBanner urgencyCounts={urgencyCounts} />
      </Box>

      {/* Three-panel layout */}
      <Group gap={0} align="stretch" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left panel — client list */}
        <Box style={{ width: 280, minWidth: 220, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ClientRankList
            entries={rankEntries}
            selectedId={selectedClientId}
            onSelect={handleSelectClient}
            loading={false}
            onShowMore={handleShowMoreClients}
          />
        </Box>

        {/* Center panel — workflow canvas */}
        <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--mantine-color-default-border)' }}>
          {!selectedClientId ? (
            <Stack align="center" justify="center" style={{ flex: 1 }} gap="sm">
              <Text size="xl">🗺</Text>
              <Text c="dimmed" size="sm" ta="center" maw={320}>{t('workflow.selectClient')}</Text>
            </Stack>
          ) : isLoadingSelected ? (
            <Stack align="center" justify="center" style={{ flex: 1 }} gap="sm">
              <Loader size="sm" />
              <Text c="dimmed" size="sm">{t('workflow.loading')}</Text>
            </Stack>
          ) : loadError ? (
            <Box p="md">
              <Alert color="red" variant="light">{loadError}</Alert>
            </Box>
          ) : variant === 'radial' ? (
            <WorkflowCanvasRadial
              client={selectedClientData?.client}
              recommendations={recommendations}
              urgencyScore={selectedEntry?.urgencyScore ?? 0}
              urgencyLevel={selectedEntry?.urgencyLevel ?? 'routine'}
              diagnosisSummary={selectedEntry?.diagnosisSummary ?? ''}
              trend={selectedEntry?.trend ?? 'unknown'}
              selectedRecId={selectedRec?.id}
              onSelectRec={handleSelectRec}
              onAction={handleAction}
              onStatusChange={handleStatusChange}
              onToggleCategory={handleToggleCategory}
            />
          ) : variant === 'priority' ? (
            <WorkflowCanvasPriority
              client={selectedClientData?.client}
              recommendations={recommendations}
              urgencyScore={selectedEntry?.urgencyScore ?? 0}
              urgencyLevel={selectedEntry?.urgencyLevel ?? 'routine'}
              diagnosisSummary={selectedEntry?.diagnosisSummary ?? ''}
              trend={selectedEntry?.trend ?? 'unknown'}
              selectedRecId={selectedRec?.id}
              onSelectRec={handleSelectRec}
              onAction={handleAction}
              onStatusChange={handleStatusChange}
              onToggleCategory={handleToggleCategory}
            />
          ) : (
            <WorkflowCanvas
              client={selectedClientData?.client}
              recommendations={recommendations}
              urgencyScore={selectedEntry?.urgencyScore ?? 0}
              urgencyLevel={selectedEntry?.urgencyLevel ?? 'routine'}
              diagnosisSummary={selectedEntry?.diagnosisSummary ?? ''}
              trend={selectedEntry?.trend ?? 'unknown'}
              selectedRecId={selectedRec?.id}
              onSelectRec={handleSelectRec}
              onAction={handleAction}
              onStatusChange={handleStatusChange}
              onToggleCategory={handleToggleCategory}
            />
          )}

        </Box>

        {/* Right panel — placeholder when drawer is closed on wider screens */}
        {!drawerOpened && selectedRec && (
          <Box
            style={{
              width: 280,
              flexShrink: 0,
              borderLeft: '1px solid var(--mantine-color-default-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text c="dimmed" size="xs" ta="center" px="md">
              Select a recommendation to view details
            </Text>
          </Box>
        )}
      </Group>

      {/* Detail drawer */}
      <RecommendationDrawer
        rec={selectedRec}
        client={selectedClientData?.client}
        allRecommendations={recommendations}
        opened={drawerOpened}
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
        onAction={handleAction}
        clientId={selectedClientId}
        fetchHistory={fetchRecommendationHistory}
      />
    </Stack>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyCountBand(total) {
  if (total >= 150) return '150_plus';
  if (total >= 100) return '100_149';
  if (total >= 50) return '50_99';
  if (total >= 20) return '20_49';
  return 'under_20';
}
