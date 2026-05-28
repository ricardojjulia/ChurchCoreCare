import { Paper, Text, Skeleton } from '@mantine/core';
import { AreaChart } from '@mantine/charts';

export default function SessionVolumeChart({ data, loading }) {
  if (loading) return <Skeleton height={220} radius="lg" />;

  const buckets = data?.buckets ?? [];

  return (
    <Paper withBorder radius="lg" p="lg">
      <Text fw={600} mb="md">Session Volume</Text>
      {buckets.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No session data for this period.</Text>
      ) : (
        <AreaChart
          h={180}
          data={buckets}
          dataKey="date"
          series={[{ name: 'count', label: 'Sessions', color: 'indigo.6' }]}
          curveType="monotone"
          withDots={false}
          gridAxis="y"
        />
      )}
    </Paper>
  );
}
