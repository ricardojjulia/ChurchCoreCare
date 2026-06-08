import { Box, Group, Paper, Text, Skeleton, Stack } from '@mantine/core';

export default function OutcomeTrendChart({ data, loading, title = 'PHQ-9 Outcome Trend' }) {
  if (loading) return <Skeleton height={240} radius="lg" />;

  const points = data?.points ?? [];

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="xs" mb="md">
        <Text fw={600}>{title}</Text>
        <Text fz="xs" c="dimmed">Lower scores indicate symptom improvement.</Text>
      </Stack>

      {points.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No outcome data for this period.</Text>
      ) : (
        <Stack gap="xs" role="list" aria-label={title}>
          {points.map((point) => {
            const score = Math.max(0, Math.min(27, Number(point.score) || 0));
            return (
              <Group key={`${point.date}-${score}`} gap="sm" wrap="nowrap" role="listitem">
                <Text fz="xs" c="dimmed" w={78}>
                  {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <Box
                  aria-label={`PHQ-9 score ${score}`}
                  style={{
                    background: 'var(--mantine-color-indigo-6)',
                    borderRadius: 999,
                    height: 10,
                    minWidth: score > 0 ? 8 : 0,
                    width: `${(score / 27) * 100}%`,
                  }}
                />
                <Text fz="xs" fw={700} w={24} ta="right">{score}</Text>
              </Group>
            );
          })}
        </Stack>
      )}

      <Stack gap={4} mt="sm" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[
          { range: '0–4', label: 'Minimal', color: '#16a34a' },
          { range: '5–9', label: 'Mild', color: '#ca8a04' },
          { range: '10–14', label: 'Moderate', color: '#ea580c' },
          { range: '15–19', label: 'Mod-Severe', color: '#dc2626' },
          { range: '20–27', label: 'Severe', color: '#991b1b' },
        ].map((b) => (
          <Text key={b.label} fz="xs" c="dimmed">
            <span style={{ color: b.color, fontWeight: 700 }}>■ </span>
            {b.range} {b.label}
          </Text>
        ))}
      </Stack>
    </Paper>
  );
}
