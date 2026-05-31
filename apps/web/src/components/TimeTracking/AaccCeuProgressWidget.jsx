import { useEffect, useState } from 'react';
import { Paper, Stack, Group, Text, Progress, Badge, Button, Loader, Alert } from '@mantine/core';
import { FileText } from 'lucide-react';

const CREDENTIAL_LABELS = {
  bcpcc:          'BCPCC',
  ncca_fellow:    'NCCA Fellow',
  ncca_diplomate: 'NCCA Diplomate',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export default function AaccCeuProgressWidget({ staffId }) {
  const [progress, setProgress]   = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);

  useEffect(() => {
    if (!staffId) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/v1/staff/${encodeURIComponent(staffId)}/aacc-ceu/progress`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => { throw new Error(b.error ?? `Request failed: ${res.status}`); });
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [staffId]);

  if (loading) {
    return (
      <Group py="sm">
        <Loader size="xs" />
        <Text size="sm" c="dimmed">Loading AACC progress…</Text>
      </Group>
    );
  }

  if (error) {
    return <Alert color="red" title="AACC CEU">{error}</Alert>;
  }

  if (!progress || progress.credentialType === null || progress.credentialType === undefined) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        Set up AACC credential tracking in your profile to enable CE tracking.
      </Text>
    );
  }

  const {
    credentialType,
    cycleEndDate,
    hoursRequired,
    totalHours,
    percentComplete,
  } = progress;

  const pct     = Math.min(100, Math.max(0, Number(percentComplete ?? 0)));
  const isComplete = pct >= 100;
  const label   = CREDENTIAL_LABELS[credentialType] ?? credentialType;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Badge color={isComplete ? 'teal' : 'indigo'} variant="light">
              {label}
            </Badge>
            <Text size="sm" fw={600}>AACC Renewal Progress</Text>
          </Group>
          <Button
            size="xs"
            variant="subtle"
            leftSection={<FileText size={14} />}
            component="a"
            href={`/api/v1/staff/${encodeURIComponent(staffId)}/aacc-ceu/renewal-report`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Generate Report
          </Button>
        </Group>

        <Progress
          value={pct}
          color={isComplete ? 'teal' : 'indigo'}
          size="md"
          radius="xl"
        />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {Number(totalHours ?? 0).toFixed(1)} / {Number(hoursRequired ?? 0)} hours
          </Text>
          <Text size="xs" c="dimmed">
            Renews: {formatDate(cycleEndDate)}
          </Text>
        </Group>

        <Text size="xs" c="dimmed">{pct.toFixed(0)}% complete</Text>
      </Stack>
    </Paper>
  );
}
