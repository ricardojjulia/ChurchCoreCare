import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { RefreshCw, UserCheck } from 'lucide-react';
import { api } from '../lib/api.js';

const STATUS_COLOR = {
  active: 'green',
  ended:  'gray',
};

export default function ImpersonationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    api.listImpersonationSessions()
      .then((data) => setItems(data?.items ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <UserCheck size={20} />
          <Title order={2}>Impersonation Sessions</Title>
        </Group>
        <Button leftSection={<RefreshCw size={14} />} variant="light" onClick={load} loading={loading}>
          Refresh
        </Button>
      </Group>

      <Card withBorder radius="md" p="md" bg="yellow.0">
        <Text size="sm">
          Impersonation sessions allow platform admins to log in as a tenant user for support purposes.
          All sessions are audit-logged. End sessions immediately after support work is complete.
        </Text>
      </Card>

      {error && <Alert color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <Text c="dimmed">No impersonation sessions on record.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Target tenant</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Started by</Table.Th>
              <Table.Th>Started at</Table.Th>
              <Table.Th>Ended at</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((session) => (
              <Table.Tr key={session.id}>
                <Table.Td><Text size="sm" ff="monospace">{session.targetTenantId ?? session.target_tenant_id ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{session.reason ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{session.requestedBy ?? session.requested_by ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs">{session.startedAt ?? session.started_at ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs">{session.endedAt ?? session.ended_at ?? '—'}</Text></Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLOR[session.status] ?? 'gray'} variant="light">
                    {session.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
