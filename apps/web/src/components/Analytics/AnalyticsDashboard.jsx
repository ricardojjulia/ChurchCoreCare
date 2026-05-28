import { useState } from 'react';
import {
  Stack, Paper, Title, Text, Group, SegmentedControl, Button, SimpleGrid,
} from '@mantine/core';
import { Download } from 'lucide-react';
import {
  useSessionVolume, useRevenueStats, useOutcomeTrends,
  useCounselorProductivity, exportCsv,
} from '../../lib/useAnalytics.js';
import StatCard from './StatCard.jsx';
import SessionVolumeChart from './SessionVolumeChart.jsx';
import CounselorProductivityTable from './CounselorProductivityTable.jsx';
import OutcomeTrendChart from '../ClinicalChart/OutcomeTrendChart.jsx';

const PRESETS = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' },
];

function fmtCurrency(n) {
  return typeof n === 'number' ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '—';
}

export default function AnalyticsDashboard() {
  const [preset, setPreset] = useState('month');

  const sessions = useSessionVolume({ preset });
  const revenue = useRevenueStats({ preset });
  const counselors = useCounselorProductivity({ preset });
  const outcomes = useOutcomeTrends({ formKey: 'PHQ-9', preset });

  return (
    <Stack p="md" gap="md">
      <Paper
        radius="xl"
        p="xl"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(129,140,248,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,244,255,0.94))',
          border: '1px solid rgba(79,70,229,0.12)',
          boxShadow: '0 20px 50px rgba(34, 51, 93, 0.08)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="indigo" style={{ letterSpacing: '0.12em', marginBottom: 6 }}>
              Practice Reporting
            </Text>
            <Title order={2}>Analytics</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Session volume, revenue, and clinical outcomes.
            </Text>
          </div>
          <SegmentedControl
            data={PRESETS}
            value={preset}
            onChange={setPreset}
            size="sm"
          />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <StatCard
          label="Total Sessions"
          value={sessions.loading ? '…' : sessions.data?.total ?? 0}
          sub="completed appointments"
        />
        <StatCard
          label="Billed"
          value={revenue.loading ? '…' : fmtCurrency(revenue.data?.billed)}
          sub="gross charges"
        />
        <StatCard
          label="Collected"
          value={revenue.loading ? '…' : fmtCurrency(revenue.data?.collected)}
          sub="payments received"
        />
        <StatCard
          label="Outstanding"
          value={revenue.loading ? '…' : fmtCurrency(revenue.data?.outstanding)}
          sub="claims pending"
        />
      </SimpleGrid>

      <Group justify="flex-end" gap="sm">
        <Button
          variant="default"
          size="xs"
          leftSection={<Download size={13} />}
          onClick={() => exportCsv('sessions', { preset })}
        >
          Export Sessions CSV
        </Button>
        <Button
          variant="default"
          size="xs"
          leftSection={<Download size={13} />}
          onClick={() => exportCsv('revenue', { preset })}
        >
          Export Revenue CSV
        </Button>
      </Group>

      <SessionVolumeChart data={sessions.data} loading={sessions.loading} />

      <CounselorProductivityTable data={counselors.data} loading={counselors.loading} />

      <OutcomeTrendChart data={outcomes.data} loading={outcomes.loading} title="Aggregate PHQ-9 Outcomes" />
    </Stack>
  );
}
