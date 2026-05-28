import { Paper, Text, Skeleton, Stack } from '@mantine/core';
import { LineChart, ReferenceLine } from '@mantine/charts';

// PHQ-9 severity thresholds: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 mod-severe, 20+ severe
const PHQ9_BANDS = [
  { value: 5,  color: 'rgba(250,204,21,0.15)', label: 'Mild' },
  { value: 10, color: 'rgba(249,115,22,0.15)', label: 'Moderate' },
  { value: 15, color: 'rgba(239,68,68,0.15)',  label: 'Mod-Severe' },
  { value: 20, color: 'rgba(185,28,28,0.15)',  label: 'Severe' },
];

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
        <LineChart
          h={200}
          data={points}
          dataKey="date"
          series={[{ name: 'score', label: 'PHQ-9 Score', color: 'indigo.6' }]}
          curveType="monotone"
          withDots
          yAxisProps={{ domain: [0, 27] }}
          referenceLines={PHQ9_BANDS.map((b) => ({
            y: b.value,
            color: 'gray.4',
            label: b.label,
            labelPosition: 'insideTopRight',
          }))}
        />
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
