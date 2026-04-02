import { useRef, useState, useEffect } from 'react';
import { Alert, Badge, Box, Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import WorkflowNode from './WorkflowNode.jsx';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ORDER } from './engine/types.js';
import { useI18n } from '../../lib/i18nContext.jsx';

/**
 * Groups recommendations by category, preserving CATEGORY_ORDER.
 * @param {Array} recs
 * @returns {Array<{ category: string, recs: Array }>}
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
 * Client snapshot card — the "start node" of the canvas.
 */
function ClientSnapshot({ client, urgencyLevel, diagnosisSummary, trend, recommendationCount }) {
  const urgencyColors = { critical: 'red', high: 'orange', moderate: 'yellow', routine: 'gray' };
  const trendIcons = { improving: '↑', stable: '→', declining: '↓', unknown: '~' };
  const trendColors = { improving: 'green', stable: 'gray', declining: 'red', unknown: 'gray' };
  const color = urgencyColors[urgencyLevel] ?? 'gray';

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{ borderLeft: `4px solid var(--mantine-color-${color}-6)` }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Title order={4}>
              {client?.firstName ?? ''} {client?.lastName ?? ''}
            </Title>
            <Badge color={color} variant="filled" size="sm">{urgencyLevel}</Badge>
            {trend !== 'unknown' && (
              <Badge color={trendColors[trend]} variant="light" size="sm">
                {trendIcons[trend]} {trend}
              </Badge>
            )}
          </Group>
          {diagnosisSummary && (
            <Text size="xs" c="dimmed">{diagnosisSummary}</Text>
          )}
        </Stack>
        <Badge color="blue" variant="light" size="md">
          {recommendationCount} rec{recommendationCount !== 1 ? 's' : ''}
        </Badge>
      </Group>
    </Paper>
  );
}

/**
 * Category section header with connecting line.
 */
function CategoryHeader({ category, count, collapsed, onToggle }) {
  const color = CATEGORY_COLORS[category] ?? 'gray';
  const icon = CATEGORY_ICONS[category] ?? '•';
  const label = category.replace(/_/g, ' ');

  return (
    <Group gap="xs" align="center" justify="space-between" wrap="nowrap">
      <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
        <Box
          style={{
            width: 2,
            height: 16,
            background: `var(--mantine-color-${color}-4)`,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        <Text size="xs" fw={700} c={`${color}.6`} tt="uppercase" lineClamp={1}>
          {icon} {label}
        </Text>
        <Badge size="xs" color={color} variant="light">{count}</Badge>
      </Group>
      <Button
        size="compact-xs"
        variant="subtle"
        color="gray"
        onClick={onToggle}
        data-testid={`workflow-category-toggle-${category}`}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </Button>
    </Group>
  );
}

/**
 * Main workflow canvas — vertical node graph for the selected client.
 */
export default function WorkflowCanvas({
  client,
  recommendations,
  urgencyScore,
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
  const canvasRef = useRef(null);

  const visible = (recommendations ?? []).filter((r) => r.status !== 'hidden');
  const pendingCount = visible.filter((r) => r.status === 'pending').length;
  const groups = groupByCategory(visible);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  useEffect(() => {
    if (!client?.id) {
      setCollapsedCategories(new Set());
      return;
    }
    if (visible.length >= 10) {
      setCollapsedCategories(new Set(groups.slice(2).map((g) => g.category)));
      return;
    }
    setCollapsedCategories(new Set());
  }, [client?.id, visible.length, groups.map((g) => g.category).join('|')]);

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      const isCollapsed = next.has(category);
      if (isCollapsed) next.delete(category);
      else next.add(category);
      onToggleCategory?.(category, !isCollapsed);
      return next;
    });
  };

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }} ref={canvasRef} data-testid="workflow-canvas">
      <Stack gap="lg" p="md" style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Client snapshot node */}
        <ClientSnapshot
          client={client}
          urgencyLevel={urgencyLevel}
          diagnosisSummary={diagnosisSummary}
          trend={trend}
          recommendationCount={pendingCount}
        />

        {/* Connector line from snapshot to first category */}
        {groups.length > 0 && (
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              style={{
                width: 2,
                height: 24,
                background: 'var(--mantine-color-default-border)',
                borderRadius: 1,
              }}
            />
          </Box>
        )}

        {visible.length === 0 ? (
          <Alert color="teal" variant="light">
            <Text size="sm">{t('workflow.canvas.noRecs')}</Text>
          </Alert>
        ) : (
          groups.map((group, groupIndex) => (
            <Stack key={group.category} gap="sm" data-testid={`workflow-category-${group.category}`}>
              <CategoryHeader
                category={group.category}
                count={group.recs.length}
                collapsed={collapsedCategories.has(group.category)}
                onToggle={() => toggleCategory(group.category)}
              />

              {!collapsedCategories.has(group.category) && (
                <Stack gap="xs" data-testid={`workflow-category-items-${group.category}`}>
                  {group.recs.map((rec) => (
                    <WorkflowNode
                      key={rec.id}
                      rec={rec}
                      selected={selectedRecId === rec.id}
                      onSelect={() => onSelectRec?.(rec)}
                      onAction={(action) => onAction?.(rec, action)}
                      onStatusChange={(status) => onStatusChange?.(rec.id, status)}
                    />
                  ))}
                </Stack>
              )}

              {/* Connector to next group */}
              {groupIndex < groups.length - 1 && (
                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    style={{
                      width: 2,
                      height: 20,
                      background: 'var(--mantine-color-default-border)',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              )}
            </Stack>
          ))
        )}
      </Stack>
    </ScrollArea>
  );
}
