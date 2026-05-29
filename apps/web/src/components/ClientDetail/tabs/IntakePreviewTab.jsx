import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { fetchClientIntakePreview } from '../../../lib/clientApi.js';
import { useI18n } from '../../../lib/i18nContext.jsx';

function KeyValueList({ title, items, emptyLabel }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Title order={4}>{title}</Title>
      <Stack gap="sm" mt="sm">
        {items.length === 0 ? (
          <Text size="sm" c="dimmed">{emptyLabel}</Text>
        ) : items.map((item) => (
          <div key={`${title}-${item.label}`}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">{item.label}</Text>
            <Text size="sm">{item.value}</Text>
          </div>
        ))}
      </Stack>
    </Paper>
  );
}

function urgencyColor(level) {
  if (level === 'critical') return 'red';
  if (level === 'moderate') return 'yellow';
  return 'gray';
}

export default function IntakePreviewTab({ clientId }) {
  const { t } = useI18n();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClientIntakePreview(clientId)
      .then((payload) => {
        if (cancelled) return;
        const item = payload?.item ?? null;
        setPreview(item);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Unable to load intake preview.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const screeningSignals = useMemo(
    () => Array.isArray(preview?.screeningSignals) ? preview.screeningSignals : [],
    [preview?.screeningSignals],
  );
  const careRoutes = useMemo(
    () => Array.isArray(preview?.careRoutes) ? preview.careRoutes : [],
    [preview?.careRoutes],
  );
  const areasToAssess = useMemo(
    () => Array.isArray(preview?.areasToAssess) ? preview.areasToAssess : [],
    [preview?.areasToAssess],
  );
  const reportedConditions = useMemo(
    () => Array.isArray(preview?.reportedConditions) ? preview.reportedConditions : [],
    [preview?.reportedConditions],
  );

  if (loading) {
    return (
      <Group py="lg">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">{t('intake.preview.loading')}</Text>
      </Group>
    );
  }

  if (error) {
    return (
      <Alert color="red" title={t('intake.preview.errorTitle')}>
        {error}
      </Alert>
    );
  }

  if (!preview) {
    return (
      <Alert color="gray" title={t('intake.preview.emptyTitle')}>
        {t('intake.preview.emptyBody')}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Alert color="blue" title={t('intake.preview.counselorReviewTitle')}>
        {preview.disclaimer}
      </Alert>

      {!preview.eligible ? (
        <Alert color="yellow" title={t('intake.preview.notActiveTitle')}>
          <Stack gap={4}>
            {(preview.reasons ?? []).map((reason) => (
              <Text key={reason} size="sm">{reason}</Text>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Paper withBorder radius="md" p="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">{t('intake.preview.intakeStatus')}</Text>
          <Text size="lg" fw={700} mt={4}>
            {preview.intake?.completed ? t('intake.preview.complete') : t('intake.preview.incomplete')}
          </Text>
          <Text size="sm" c="dimmed" mt={6}>
            {t('intake.preview.packetStatus', { status: preview.intake?.packetStatus ?? 'Not on file' })}
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">{t('intake.preview.heldSessions')}</Text>
          <Text size="lg" fw={700} mt={4}>{preview.sessions?.heldSessionCount ?? 0}</Text>
          <Text size="sm" c="dimmed" mt={6}>
            {t('intake.preview.futureAppointments', { count: preview.sessions?.futureAppointmentCount ?? 0 })}
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">{t('intake.preview.nextAppointment')}</Text>
          <Text size="lg" fw={700} mt={4}>
            {preview.sessions?.nextAppointmentAt
              ? new Date(preview.sessions.nextAppointmentAt).toLocaleString()
              : t('intake.preview.notScheduled')}
          </Text>
          <Text size="sm" c="dimmed" mt={6}>
            {preview.generatedAt
              ? t('intake.preview.generatedAt', { date: new Date(preview.generatedAt).toLocaleString() })
              : t('intake.preview.generatedJustNow')}
          </Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <KeyValueList title={t('intake.preview.reportedContext')} items={preview.reportedContext ?? []} emptyLabel={t('intake.preview.emptyLabel')} />
        <KeyValueList title={t('intake.preview.presentingConcerns')} items={preview.presentingConcerns ?? []} emptyLabel={t('intake.preview.emptyLabel')} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <KeyValueList title={t('intake.preview.reportedContributors')} items={preview.reportedContributors ?? []} emptyLabel={t('intake.preview.emptyLabel')} />
        <Paper withBorder radius="md" p="md">
          <Title order={4}>{t('intake.preview.reportedConditions')}</Title>
          <Stack gap="xs" mt="sm">
            {reportedConditions.length === 0 ? (
              <Text size="sm" c="dimmed">{t('intake.preview.noConditions')}</Text>
            ) : reportedConditions.map((entry) => (
              <Group key={entry} align="flex-start" wrap="nowrap">
                <ThemeIcon color="gray" variant="light" size="sm" mt={2}>•</ThemeIcon>
                <Text size="sm">{entry}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="center">
          <Title order={4}>{t('intake.preview.screeningSignals')}</Title>
          <Text size="sm" c="dimmed">{screeningSignals.length} item(s)</Text>
        </Group>
        <Stack gap="sm" mt="sm">
          {screeningSignals.length === 0 ? (
            <Text size="sm" c="dimmed">{t('intake.preview.noScreeningSignals')}</Text>
          ) : screeningSignals.map((signal) => (
            <Paper key={`${signal.formKey}-${signal.title}-${signal.submittedAt}`} radius="sm" p="sm" bg="var(--mantine-color-gray-0)">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600} size="sm">{signal.title}</Text>
                  <Text size="xs" c="dimmed">
                    {signal.scoreValue != null && signal.scoreLabel
                      ? `${signal.scoreLabel}: ${signal.scoreValue}`
                      : t('intake.preview.structuredSignal')}
                  </Text>
                </div>
                <Badge color={urgencyColor(signal.urgency)} variant="light">
                  {signal.urgency}
                </Badge>
              </Group>
              {signal.interpretationLabel ? (
                <Text size="sm" mt={6}>{signal.interpretationLabel}</Text>
              ) : null}
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="center">
          <Title order={4}>{t('intake.preview.careRouteHypotheses')}</Title>
          <Text size="sm" c="dimmed">{t('intake.preview.careRouteSubtitle')}</Text>
        </Group>
        <Stack gap="sm" mt="sm">
          {careRoutes.map((route) => (
            <Paper key={route.id} radius="sm" p="sm" bg="var(--mantine-color-blue-0)">
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm">{route.title}</Text>
                <Badge variant="light">{t('intake.preview.confidence', { value: route.confidence })}</Badge>
              </Group>
              {(route.basis ?? []).length > 0 ? (
                <Stack gap={4} mt="xs">
                  {route.basis.map((basis) => (
                    <Text key={basis} size="sm" c="dimmed">{basis}</Text>
                  ))}
                </Stack>
              ) : null}
              {route.reviewPrompt ? (
                <Text size="sm" mt="xs">{route.reviewPrompt}</Text>
              ) : null}
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>{t('intake.preview.areasToAssess')}</Title>
        <Stack gap="xs" mt="sm">
          {areasToAssess.length === 0 ? (
            <Text size="sm" c="dimmed">{t('intake.preview.noAreasToAssess')}</Text>
          ) : areasToAssess.map((item) => (
            <Group key={item} align="flex-start" wrap="nowrap">
              <ThemeIcon color="blue" variant="light" size="sm" mt={2}>•</ThemeIcon>
              <Text size="sm">{item}</Text>
            </Group>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
