import { Paper, Text, Group, ThemeIcon } from '@mantine/core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, sub, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'teal' : trend < 0 ? 'red' : 'gray';

  return (
    <Paper withBorder radius="lg" p="lg" style={{ minWidth: 160 }}>
      <Text fz="xs" tt="uppercase" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.08em' }}>
        {label}
      </Text>
      <Group align="flex-end" gap="xs">
        <Text fz={32} fw={800} lh={1}>
          {value ?? '—'}
        </Text>
        {trend != null && (
          <ThemeIcon size="sm" variant="light" color={trendColor} mb={4}>
            <TrendIcon size={14} />
          </ThemeIcon>
        )}
      </Group>
      {sub && (
        <Text fz="xs" c="dimmed" mt={4}>{sub}</Text>
      )}
    </Paper>
  );
}
