import { useEffect, useState } from 'react';
import {
  Stack, Title, Text, SimpleGrid, Paper, Group, Badge, Button, Alert, Loader, Center,
} from '@mantine/core';
import { Building2 } from 'lucide-react';
import { useI18n } from '../../lib/i18nContext.jsx';

async function fetchPractices() {
  const res = await fetch('/api/v1/platform/practices', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load practices: ${res.status}`);
  const data = await res.json();
  return data.practices ?? [];
}

function PracticeCard({ practice, onEnter, t }) {
  const typeLabel = t(`platform.practice.type.${practice.practiceType}`) ?? practice.practiceType;
  return (
    <Paper radius="lg" p="xl" withBorder shadow="xs" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Building2 size={20} style={{ color: 'var(--mantine-color-indigo-6)', flexShrink: 0 }} />
          <div>
            <Text fw={700} size="md" lh={1.2}>{practice.practiceName}</Text>
            <Text size="xs" c="dimmed" mt={2}>{practice.tenantId}</Text>
          </div>
        </Group>
        <Badge variant="light" color="indigo" size="sm" radius="md">{typeLabel}</Badge>
      </Group>

      <SimpleGrid cols={2} spacing="xs">
        <Paper radius="md" p="sm" bg="var(--mantine-color-gray-0)" withBorder={false}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>Clients</Text>
          <Text fw={700} size="lg">{practice.activeClientCount}</Text>
          <Text size="xs" c="dimmed">{practice.clientCount} total</Text>
        </Paper>
        <Paper radius="md" p="sm" bg="var(--mantine-color-gray-0)" withBorder={false}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>Staff</Text>
          <Text fw={700} size="lg">{practice.activeStaffCount}</Text>
          <Text size="xs" c="dimmed">{practice.staffCount} total</Text>
        </Paper>
      </SimpleGrid>

      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          {practice.planType} · {practice.timezone ?? 'UTC'}
        </Text>
        <Button size="xs" variant="filled" color="indigo" onClick={() => onEnter(practice)}>
          {t('platform.practice.enter')}
        </Button>
      </Group>
    </Paper>
  );
}

export default function PlatformDashboard({ onEnterPractice }) {
  const { t } = useI18n();
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchPractices()
      .then(setPractices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack p="md" gap="md">
      <Paper
        radius="xl"
        p="xl"
        style={{
          background: 'radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 40%), linear-gradient(180deg, rgba(255,255,255,0.97), rgba(238,242,255,0.95))',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 20px 50px rgba(34, 51, 93, 0.07)',
        }}
      >
        <Title order={2}>{t('platform.dashboard.title')}</Title>
        <Text c="dimmed" size="sm" mt={4}>{t('platform.dashboard.subtitle')}</Text>
      </Paper>

      {loading && (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      )}

      {error && (
        <Alert color="red" title="Error" radius="lg">
          {error}
        </Alert>
      )}

      {!loading && !error && practices.length === 0 && (
        <Alert color="gray" radius="lg">{t('platform.noPractices')}</Alert>
      )}

      {!loading && !error && practices.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.tenantId}
              practice={practice}
              onEnter={onEnterPractice}
              t={t}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
