import { useState } from 'react';
import { Alert, Group, Text, Button } from '@mantine/core';
import { Zap } from 'lucide-react';

export default function TrialBanner({ trialStatus }) {
  const [portalLoading, setPortalLoading] = useState(false);

  if (!trialStatus?.isTrial) return null;
  const daysLeft = trialStatus.daysLeft;
  if (daysLeft === null || daysLeft > 14) return null;

  const urgent = daysLeft <= 3;
  const color = urgent ? 'red' : 'orange';

  const handleUpgrade = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch (_) {
      setPortalLoading(false);
    }
  };

  return (
    <Alert
      color={color}
      variant="light"
      radius={0}
      style={{ borderBottom: `1px solid var(--mantine-color-${color}-3)` }}
      icon={<Zap size={16} />}
    >
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={500}>
          {daysLeft === 0
            ? 'Your free trial expires today.'
            : daysLeft === 1
            ? 'Your free trial expires tomorrow.'
            : `Your free trial expires in ${daysLeft} days.`}{' '}
          <Text span c="dimmed" size="sm">Add a payment method to keep access.</Text>
        </Text>
        <Button
          size="xs"
          color={color}
          variant="filled"
          loading={portalLoading}
          onClick={handleUpgrade}
          style={{ flexShrink: 0 }}
        >
          Upgrade Now
        </Button>
      </Group>
    </Alert>
  );
}
