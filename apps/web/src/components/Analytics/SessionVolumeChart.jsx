import { Box, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { useI18n } from '../../lib/i18nContext.jsx';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SessionVolumeChart({ data, loading }) {
  const { t } = useI18n();
  if (loading) return <Skeleton height={220} radius="lg" />;

  const buckets = data?.buckets ?? [];
  const maxCount = Math.max(...buckets.map((bucket) => Number(bucket.count) || 0), 1);

  return (
    <Paper withBorder radius="lg" p="lg">
      <Text fw={600} mb="md">{t('analytics.sessionVolume.title')}</Text>
      {buckets.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">{t('analytics.sessionVolume.empty')}</Text>
      ) : (
        <Stack gap="xs" role="list" aria-label={t('analytics.sessionVolume.title')}>
          {buckets.map((bucket) => {
            const count = Number(bucket.count) || 0;
            return (
              <Group key={`${bucket.date}-${count}`} gap="sm" wrap="nowrap" role="listitem">
                <Text fz="xs" c="dimmed" w={64}>{formatDate(bucket.date)}</Text>
                <Box
                  aria-label={`${count} sessions`}
                  style={{
                    background: 'var(--mantine-color-indigo-6)',
                    borderRadius: 999,
                    height: 10,
                    minWidth: count > 0 ? 8 : 0,
                    width: `${Math.max(0, (count / maxCount) * 100)}%`,
                  }}
                />
                <Text fz="xs" fw={700} w={24} ta="right">{count}</Text>
              </Group>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
