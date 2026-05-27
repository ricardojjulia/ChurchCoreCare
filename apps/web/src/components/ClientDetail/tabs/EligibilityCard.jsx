import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { ShieldCheck } from 'lucide-react';

const STALE_DAYS = 30;

function isStale(checkedAt) {
  if (!checkedAt) return true;
  const ms = Date.now() - new Date(checkedAt).getTime();
  return ms > STALE_DAYS * 86400 * 1000;
}

function statusColor(status) {
  if (status === 'eligible') return 'green';
  if (status === 'ineligible') return 'red';
  return 'gray';
}

function statusLabel(status) {
  if (status === 'eligible') return 'Active';
  if (status === 'ineligible') return 'Inactive';
  return 'Unknown';
}

export default function EligibilityCard({ clientId, insuranceId }) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/clients/${clientId}/insurance/${insuranceId}/verify-eligibility`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json.eligibility ?? null); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, insuranceId]);

  async function handleVerifyNow() {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/insurance/${insuranceId}/verify-eligibility`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setData(json.eligibility ?? null);
    } catch {
      setError('Eligibility check unavailable. Please try again later.');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <Group gap="xs" py="xs">
        <Loader size="xs" />
        <Text fz="xs" c="dimmed">Loading eligibility…</Text>
      </Group>
    );
  }

  const checkedAt = data?.checkedAt ?? null;
  const status = data?.status ?? null;
  const result = data?.result ?? null;
  const stale = isStale(checkedAt);

  return (
    <Card withBorder radius="sm" p="sm" mt="xs">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ShieldCheck size={14} />
            <Text fz="xs" fw={600} tt="uppercase" c="dimmed">Eligibility</Text>
          </Group>
          <Badge color={statusColor(status)} size="sm" variant="light">
            {statusLabel(status)}
          </Badge>
        </Group>

        {stale && checkedAt && (
          <Alert color="yellow" p="xs" fz="xs">
            Eligibility data may be outdated (last checked {new Date(checkedAt).toLocaleDateString()}).
          </Alert>
        )}

        {!checkedAt && !error && (
          <Text fz="xs" c="dimmed">No eligibility check on record.</Text>
        )}

        {checkedAt && (
          <Text fz="xs" c="dimmed">
            Last verified: {new Date(checkedAt).toLocaleDateString()}
          </Text>
        )}

        {result && (
          <Stack gap={4}>
            {result.copayAmount != null && (
              <Text fz="xs">Copay: <strong>${result.copayAmount}</strong></Text>
            )}
            {result.deductibleAmount != null && (
              <Text fz="xs">Deductible: <strong>${result.deductibleAmount}</strong></Text>
            )}
            {result.planName && (
              <Text fz="xs">Plan: {result.planName}</Text>
            )}
          </Stack>
        )}

        {error && (
          <Alert color="red" p="xs" fz="xs">{error}</Alert>
        )}

        <Group>
          <Button
            size="xs"
            variant="light"
            loading={verifying}
            onClick={handleVerifyNow}
          >
            Verify Now
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
