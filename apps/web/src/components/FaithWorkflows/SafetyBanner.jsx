import { Box, Group, Paper, Text } from '@mantine/core';
import { useI18n } from '../../lib/i18nContext.jsx';

/**
 * Always-visible workflow status bar.
 * Shows three equal-width count boxes (Critical / Moderate / Routine)
 * and the standing safety disclaimer beneath.
 */
export default function SafetyBanner({ urgencyCounts = { critical: 0, moderate: 0, routine: 0 } }) {
  const { t } = useI18n();

  return (
    <Box
      px="md"
      py="xs"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
    >
      <Group gap="xs" align="stretch" wrap="nowrap">
        <CountBox
          label={t('metrics.faithfulCritical') || 'Critical'}
          value={urgencyCounts.critical}
          color="red"
        />
        <CountBox
          label={t('metrics.faithfulModerate') || 'Moderate'}
          value={urgencyCounts.moderate}
          color="yellow"
        />
        <CountBox
          label={t('metrics.faithfulRoutine') || 'Routine'}
          value={urgencyCounts.routine}
          color="blue"
        />
        <Text
          size="xs"
          c="dimmed"
          style={{ flex: 1, alignSelf: 'center', paddingLeft: 8 }}
        >
          {t('workflow.safetyBanner')}
        </Text>
      </Group>
    </Box>
  );
}

function CountBox({ label, value, color }) {
  const colorMap = {
    red:    { bg: 'var(--mantine-color-red-0)',    border: 'var(--mantine-color-red-3)',    text: 'var(--mantine-color-red-8)'    },
    yellow: { bg: 'var(--mantine-color-yellow-0)', border: 'var(--mantine-color-yellow-4)', text: 'var(--mantine-color-yellow-9)' },
    blue:   { bg: 'var(--mantine-color-blue-0)',   border: 'var(--mantine-color-blue-3)',   text: 'var(--mantine-color-blue-8)'   },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <Paper
      px="sm"
      py={6}
      radius="sm"
      style={{
        minWidth: 90,
        background: c.bg,
        border: `1px solid ${c.border}`,
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      <Text fw={700} size="lg" style={{ color: c.text, lineHeight: 1.1 }}>{value}</Text>
      <Text size="xs" style={{ color: c.text, opacity: 0.8 }}>{label}</Text>
    </Paper>
  );
}
