import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Group, Loader, Menu, Modal, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { Search, MoreHorizontal, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';

const STATUS_COLOR = {
  queued:      'blue',
  in_progress: 'yellow',
  completed:   'green',
  failed:      'red',
  suspended:   'orange',
};

const VALID_TRANSITIONS = {
  queued:      ['in_progress', 'failed'],
  in_progress: ['completed', 'failed'],
  failed:      ['queued'],
  completed:   [],
  suspended:   ['completed'],
};

function StatusBadge({ status }) {
  return (
    <Badge color={STATUS_COLOR[status] ?? 'gray'} variant="light">
      {status?.replace('_', ' ')}
    </Badge>
  );
}

export default function TenantsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    api.listProvisioningRequests()
      .then((data) => setItems(data?.items ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.updateProvisioningRequest(id, newStatus);
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
      setModal(null);
    }
  };

  const filtered = items.filter((item) => {
    const q = filter.toLowerCase();
    return !q
      || (item.requestedPracticeName ?? item.requested_practice_name ?? '').toLowerCase().includes(q)
      || (item.requestedTenantId ?? item.requested_tenant_id ?? '').toLowerCase().includes(q)
      || (item.status ?? '').includes(q);
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Tenants</Title>
        <Button leftSection={<RefreshCw size={14} />} variant="light" onClick={load} loading={loading}>
          Refresh
        </Button>
      </Group>

      {error && <Alert color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

      <TextInput
        placeholder="Filter by name, slug, or status…"
        leftSection={<Search size={14} />}
        value={filter}
        onChange={(e) => setFilter(e.currentTarget.value)}
        w={320}
      />

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <Text c="dimmed">No provisioning requests found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Practice name</Table.Th>
              <Table.Th>Slug / tenant ID</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Requested at</Table.Th>
              <Table.Th>Completed at</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((item) => {
              const practiceName = item.requestedPracticeName ?? item.requested_practice_name ?? '—';
              const tenantId     = item.requestedTenantId    ?? item.requested_tenant_id    ?? '—';
              const requestedAt  = item.requestedAt          ?? item.requested_at           ?? '—';
              const completedAt  = item.completedAt          ?? item.completed_at           ?? '—';
              const transitions  = VALID_TRANSITIONS[item.status] ?? [];

              return (
                <Table.Tr key={item.id}>
                  <Table.Td><Text size="sm" fw={500}>{practiceName}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed" ff="monospace">{tenantId}</Text></Table.Td>
                  <Table.Td><StatusBadge status={item.status} /></Table.Td>
                  <Table.Td><Text size="xs">{requestedAt}</Text></Table.Td>
                  <Table.Td><Text size="xs">{completedAt}</Text></Table.Td>
                  <Table.Td>
                    {transitions.length > 0 && (
                      <Menu shadow="md" withinPortal>
                        <Menu.Target>
                          <Button variant="subtle" size="xs" p={4} loading={updating === item.id}>
                            <MoreHorizontal size={16} />
                          </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {transitions.map((t) => (
                            <Menu.Item key={t} onClick={() => setModal({ id: item.id, status: t, practiceName })}>
                              Set to <strong>{t.replace('_', ' ')}</strong>
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={!!modal}
        onClose={() => setModal(null)}
        title="Confirm status change"
        size="sm"
      >
        {modal && (
          <Stack gap="md">
            <Text size="sm">
              Change <strong>{modal.practiceName}</strong> to status{' '}
              <Badge color={STATUS_COLOR[modal.status] ?? 'gray'} variant="light">{modal.status}</Badge>?
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                color={modal.status === 'failed' || modal.status === 'suspended' ? 'red' : 'blue'}
                onClick={() => handleStatusUpdate(modal.id, modal.status)}
                loading={updating === modal.id}
              >
                Confirm
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
