import { useEffect, useState } from 'react';
import { Paper, Text, SimpleGrid, Stack, Alert, Loader, Group } from '@mantine/core';
import { useI18n } from '../../lib/i18nContext.jsx';

function BucketCard({ label, amount, color, fmt }) {
  return (
    <Paper withBorder radius="lg" p="md">
      <Text fz="xs" tt="uppercase" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.08em' }}>{label}</Text>
      <Text fz={28} fw={800} c={color ?? 'inherit'} lh={1}>{fmt(amount)}</Text>
    </Paper>
  );
}

export default function AgingReport() {
  const { t, formatCurrency } = useI18n();
  // Aging report amounts are dollar values (DECIMAL); convert to integer cents for formatCurrency.
  const fmtCurrency = (n) => formatCurrency(Math.round(Number(n ?? 0) * 100));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/billing/reports/aging', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <Loader size="sm" />;
  if (error) return <Alert color="red">{error}</Alert>;

  const r = data?.report ?? {};

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text fw={600}>{t('billing.agingReport.title')}</Text>
        <Text fz="xs" c="dimmed">{data?.asOf ? t('billing.aging.asOf', { date: new Date(data.asOf).toLocaleDateString() }) : '—'}</Text>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        <BucketCard label={t('billing.aging.current')}    amount={r.current}     color="teal"     fmt={fmtCurrency} />
        <BucketCard label={t('billing.aging.days1to30')}  amount={r.days1to30}   color="yellow.7" fmt={fmtCurrency} />
        <BucketCard label={t('billing.aging.days31to60')} amount={r.days31to60}  color="orange.6" fmt={fmtCurrency} />
        <BucketCard label={t('billing.aging.days61to90')} amount={r.days61to90}  color="red.6"    fmt={fmtCurrency} />
        <BucketCard label={t('billing.aging.over90')}     amount={r.over90}      color="red.9"    fmt={fmtCurrency} />
        <BucketCard label={t('billing.aging.total')}      amount={r.outstanding}                  fmt={fmtCurrency} />
      </SimpleGrid>
    </Stack>
  );
}
