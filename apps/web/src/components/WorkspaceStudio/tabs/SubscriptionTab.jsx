import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../../../lib/i18nContext.jsx';
import { useSubscriptionUsage } from '../../../lib/useSubscriptionUsage.js';
import { csrfHeaders } from '../../../lib/csrf.js';
import { SectionHeader, SectionSurface, SurfaceState } from '../../ui/surface.jsx';

// ─── helpers ──────────────────────────────────────────────────────────────────

function usageColor(used, limit) {
  if (!limit) return 'blue';
  const pct = (used / limit) * 100;
  if (pct >= 100) return 'red';
  if (pct >= 80) return 'yellow';
  return 'blue';
}

function usageValue(used, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

async function openBillingPortal() {
  const res = await fetch('/api/v1/billing/portal', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Could not open billing portal');
  const { url } = await res.json();
  if (url) window.location.href = url;
}

// ─── component ────────────────────────────────────────────────────────────────

/**
 * Subscription tab — Workspace Studio.
 *
 * Shows plan usage bars, grace period alerts, billing portal links,
 * and a UI persona switcher.
 */
export default function SubscriptionTab() {
  const { t } = useI18n();
  const { data, loading, error } = useSubscriptionUsage();
  const [billingLoading, setBillingLoading] = useState(false);
  const [personaSwitching, setPersonaSwitching] = useState(false);

  const handleBillingPortal = async () => {
    setBillingLoading(true);
    try {
      await openBillingPortal();
    } catch {
      // portal redirect failed — stay on page
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePersonaSwitch = async (targetPersona) => {
    setPersonaSwitching(true);
    try {
      await fetch('/api/v1/tenant/ui-persona', {
        method: 'PATCH',
        credentials: 'include',
        headers: csrfHeaders(),
        body: JSON.stringify({ persona: targetPersona }),
      });
      window.location.reload();
    } catch {
      setPersonaSwitching(false);
    }
  };

  if (loading) {
    return <SurfaceState type="loading" message={t('state.loading')} />;
  }

  if (error) {
    return (
      <SurfaceState
        type="error"
        title={t('state.unableToLoad')}
        message={error}
      />
    );
  }

  const plan = data?.plan ?? {};
  const usage = data?.usage ?? {};
  const grace = data?.grace ?? {};

  const {
    planType,
    uiPersona,
    planDisplayName,
    counselorLimit,
    clientLimit,
  } = plan;

  const { activeCounselors = 0, activeClients = 0 } = usage;
  const {
    counselorsInGrace,
    clientsInGrace,
    graceDaysRemaining,
    graceExpired,
  } = grace;

  const hasLimits = counselorLimit !== null || clientLimit !== null;
  const isSoloPlan = planType === 'solo';
  const isSoloPersona = uiPersona === 'solo';

  return (
    <Stack gap="md">
      {/* ── Plan overview ───────────────────────────────────── */}
      <SectionSurface>
        <SectionHeader
          title={t('subscription.plan.title') || 'Your Plan'}
          meta={
            <Badge color="blue" variant="light">
              {planDisplayName || planType || 'Plan'}
            </Badge>
          }
        />

        {/* Grace period alerts */}
        {graceExpired ? (
          <Alert
            color="red"
            icon={<AlertTriangle size={16} />}
            mb="md"
            title={t('subscription.grace.expired')}
          >
            Your plan limit has expired. New counselors and clients cannot be
            added until you upgrade.
          </Alert>
        ) : (counselorsInGrace || clientsInGrace) ? (
          <Alert
            color="yellow"
            icon={<AlertTriangle size={16} />}
            mb="md"
            title={t('subscription.grace.warning')}
          >
            {`You're over your plan limit. You have ${graceDaysRemaining ?? 0} days before access is restricted. Upgrade to Practice to continue.`}
          </Alert>
        ) : null}

        {/* Usage bars */}
        {hasLimits ? (
          <Stack gap="sm">
            {counselorLimit !== null && (
              <div>
                <Group justify="space-between" mb={4}>
                  <Text fz="sm" fw={500}>
                    {t('subscription.usage.counselors')}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {activeCounselors} / {counselorLimit} counselors
                  </Text>
                </Group>
                <Progress
                  value={usageValue(activeCounselors, counselorLimit)}
                  color={usageColor(activeCounselors, counselorLimit)}
                  size="md"
                  radius="sm"
                />
              </div>
            )}
            {clientLimit !== null && (
              <div>
                <Group justify="space-between" mb={4}>
                  <Text fz="sm" fw={500}>
                    {t('subscription.usage.clients')}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {activeClients} / {clientLimit} clients
                  </Text>
                </Group>
                <Progress
                  value={usageValue(activeClients, clientLimit)}
                  color={usageColor(activeClients, clientLimit)}
                  size="md"
                  radius="sm"
                />
              </div>
            )}
          </Stack>
        ) : (
          <Text fz="sm" c="dimmed">
            Unlimited counselors · Unlimited clients
          </Text>
        )}

        <Divider my="md" />

        {/* Billing info */}
        <Text fz="xs" c="dimmed" mb="sm">
          Manage billing and renewal in the Stripe portal
        </Text>
        <Group gap="xs">
          <Button
            variant="default"
            size="sm"
            loading={billingLoading}
            onClick={handleBillingPortal}
          >
            Manage Billing
          </Button>
          {isSoloPlan && (
            <Button
              variant="light"
              color="blue"
              size="sm"
              loading={billingLoading}
              onClick={handleBillingPortal}
            >
              Upgrade to Practice
            </Button>
          )}
        </Group>
      </SectionSurface>

      {/* ── UI persona switcher ─────────────────────────────── */}
      <SectionSurface>
        <SectionHeader
          title="Interface Mode"
          description="Switch between Solo and Practice views to match how you work."
        />
        {isSoloPersona ? (
          <Tooltip
            label="Reveals staff management, multi-location, and full Workspace Studio tabs"
            position="bottom-start"
            withArrow
          >
            <Button
              variant="subtle"
              size="sm"
              loading={personaSwitching}
              onClick={() => handlePersonaSwitch('practice')}
            >
              {t('subscription.persona.toPractice')}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            label="Simplifies the UI for single-counselor use"
            position="bottom-start"
            withArrow
          >
            <Button
              variant="subtle"
              size="sm"
              loading={personaSwitching}
              onClick={() => handlePersonaSwitch('solo')}
            >
              {t('subscription.persona.toSolo')}
            </Button>
          </Tooltip>
        )}
      </SectionSurface>
    </Stack>
  );
}
