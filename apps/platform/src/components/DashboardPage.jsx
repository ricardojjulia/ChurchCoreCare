import { useEffect, useState } from 'react';
import { Alert, Badge, Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { Activity, Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '../lib/api.js';

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">{label}</Text>
          <Text size="xl" fw={700}>{value ?? '—'}</Text>
        </Stack>
        {Icon && <Icon size={28} color={`var(--mantine-color-${color}-6)`} />}
      </Group>
    </Card>
  );
}

const STATUS_COLOR = {
  active:        'green',
  trial:         'blue',
  trial_expired: 'orange',
  past_due:      'yellow',
  suspended:     'red',
  canceled:      'gray',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [provisioning, setProvisioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.platformOverview(), api.listProvisioningRequests()])
      .then(([overview, prov]) => {
        setData(overview);
        setProvisioning(prov?.items ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader m="xl" />;
  if (error) return <Alert color="red" m="md">{error}</Alert>;

  const summary = data?.summary ?? {};
  const queued     = provisioning?.filter((r) => r.status === 'queued').length ?? 0;
  const inProgress = provisioning?.filter((r) => r.status === 'in_progress').length ?? 0;
  const failed     = provisioning?.filter((r) => r.status === 'failed').length ?? 0;

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Total tenants" value={summary.tenantCount ?? provisioning?.length} color="blue" icon={Building2} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Queued / provisioning" value={`${queued} / ${inProgress}`} color="yellow" icon={Clock} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Provisioning failures" value={failed} color={failed > 0 ? 'red' : 'gray'} icon={XCircle} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Platform status" value="Operational" color="green" icon={CheckCircle} />
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" p="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <Activity size={18} />
            <Text fw={600}>Recent provisioning activity</Text>
          </Group>
          {(!provisioning || provisioning.length === 0) ? (
            <Text size="sm" c="dimmed">No provisioning requests found.</Text>
          ) : (
            provisioning.slice(0, 10).map((req) => (
              <Group key={req.id} justify="space-between" py={4} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <Stack gap={2}>
                  <Text size="sm" fw={500}>{req.requestedPracticeName ?? req.requested_practice_name ?? req.requestedTenantId ?? req.requested_tenant_id}</Text>
                  <Text size="xs" c="dimmed">{req.requestedAt ?? req.requested_at ?? '—'}</Text>
                </Stack>
                <Badge color={req.status === 'completed' ? 'green' : req.status === 'failed' ? 'red' : req.status === 'in_progress' ? 'yellow' : 'blue'} variant="light">
                  {req.status}
                </Badge>
              </Group>
            ))
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
