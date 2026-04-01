import { Badge, Box, Button, Group, Loader, Paper, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { useState, useMemo, useEffect } from 'react';
import { formatRelativeDate } from './engine/utils.js';
import { useI18n } from '../../lib/i18nContext.jsx';

const INITIAL_RENDER_LIMIT = 100;
const RENDER_CHUNK = 50;

const URGENCY_COLORS = {
  critical: 'red',
  high:     'orange',
  moderate: 'yellow',
  routine:  'gray',
};

const TREND_ICONS = {
  improving: { icon: '↑', color: 'green' },
  stable:    { icon: '→', color: 'gray'  },
  declining: { icon: '↓', color: 'red'   },
  unknown:   { icon: '~', color: 'gray'  },
};

/**
 * Left-panel client list ranked by urgency score.
 *
 * Props:
 *   entries      — ClientRankEntry[] sorted by urgencyScore desc
 *   selectedId   — currently selected clientId
 *   onSelect     — (clientId) => void
 *   loading      — bool
 */
export default function ClientRankList({ entries = [], selectedId, onSelect, loading = false, onShowMore }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [renderLimit, setRenderLimit] = useState(INITIAL_RENDER_LIMIT);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.diagnosisSummary.toLowerCase().includes(q) ||
        e.topReasonChips.some((r) => r.toLowerCase().includes(q)),
    );
  }, [entries, query]);

  useEffect(() => {
    setRenderLimit(INITIAL_RENDER_LIMIT);
  }, [query, entries.length]);

  const visibleEntries = filtered.slice(0, renderLimit);
  const hasMore = filtered.length > visibleEntries.length;

  const handleShowMore = () => {
    const nextLimit = renderLimit + RENDER_CHUNK;
    setRenderLimit(nextLimit);
    onShowMore?.({
      shown: Math.min(nextLimit, filtered.length),
      remaining: Math.max(0, filtered.length - nextLimit),
      total: filtered.length,
    });
  };
  return (
    <Stack gap={0} style={{ height: '100%', borderRight: '1px solid var(--mantine-color-default-border)' }}>
      {/* Header */}
      <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Text fw={700} size="sm" mb="xs">{t('workflow.clientList.title')}</Text>
        <TextInput
          data-testid="workflow-client-search"
          size="xs"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </Box>

      {loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /></Group>
      ) : filtered.length === 0 ? (
        <Text c="dimmed" size="sm" p="md">{t('workflow.clientList.empty')}</Text>
      ) : (
        <ScrollArea style={{ flex: 1 }} data-testid="workflow-client-list">
          <Stack gap={0}>
            {visibleEntries.map((entry) => {
              const isSelected = entry.clientId === selectedId;
              const urgencyColor = URGENCY_COLORS[entry.urgencyLevel] ?? 'gray';
              const trend = TREND_ICONS[entry.trend] ?? TREND_ICONS.unknown;

              return (
                <Paper
                  key={entry.clientId}
                  data-testid="workflow-client-row"
                  data-client-id={entry.clientId}
                  radius={0}
                  p="sm"
                  onClick={() => onSelect?.(entry.clientId)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    borderLeft: isSelected
                      ? `3px solid var(--mantine-color-${urgencyColor}-6)`
                      : '3px solid transparent',
                    background: isSelected
                      ? `var(--mantine-color-${urgencyColor}-0)`
                      : undefined,
                  }}
                >
                  <Stack gap={4}>
                    {/* Name + urgency + trend */}
                    <Group gap="xs" wrap="nowrap" justify="space-between">
                      <Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
                        {entry.displayName}
                      </Text>
                      <Group gap={4} wrap="nowrap">
                        <Text size="xs" c={trend.color}>{trend.icon}</Text>
                        <Badge size="xs" color={urgencyColor} variant="filled">
                          {entry.urgencyLevel}
                        </Badge>
                      </Group>
                    </Group>

                    {/* Rec count + last seen */}
                    <Group gap="xs" wrap="nowrap" justify="space-between">
                      <Badge size="xs" color="blue" variant="light">
                        {entry.recommendationCount} rec{entry.recommendationCount !== 1 ? 's' : ''}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {entry.lastActivityDate
                          ? formatRelativeDate(entry.lastActivityDate)
                          : t('workflow.clientList.neverSeen')}
                      </Text>
                    </Group>

                    {/* Diagnosis summary */}
                    {entry.diagnosisSummary && (
                      <Text size="xs" c="dimmed" lineClamp={1}>{entry.diagnosisSummary}</Text>
                    )}

                    {/* Top reason chips */}
                    {entry.topReasonChips.length > 0 && (
                      <Group gap={4}>
                        {entry.topReasonChips.map((reason, i) => (
                          <Badge key={i} size="xs" color="gray" variant="outline">{reason}</Badge>
                        ))}
                      </Group>
                    )}
                  </Stack>
                </Paper>
              );
            })}
            {hasMore && (
              <Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                <Button
                  data-testid="workflow-show-more-clients"
                  size="xs"
                  variant="subtle"
                  fullWidth
                  onClick={handleShowMore}
                >
                  Show more clients ({filtered.length - visibleEntries.length} remaining)
                </Button>
              </Box>
            )}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
}
