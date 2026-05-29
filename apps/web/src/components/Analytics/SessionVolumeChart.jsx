import { Paper, Text, Skeleton } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { useI18n } from '../../lib/i18nContext.jsx';

export default function SessionVolumeChart({ data, loading }) {
  const { t } = useI18n();
  if (loading) return <Skeleton height={220} radius="lg" />;

  const buckets = data?.buckets ?? [];

  return (
    <Paper withBorder radius="lg" p="lg">
      <Text fw={600} mb="md">{t('analytics.sessionVolume.title')}</Text>
      {buckets.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">{t('analytics.sessionVolume.empty')}</Text>
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
