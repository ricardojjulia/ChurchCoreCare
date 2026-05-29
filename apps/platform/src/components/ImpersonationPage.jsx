import { useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Group, Loader, Modal, Select,
  Stack, Table, Text, Textarea, TextInput, Title,
} from '@mantine/core';
import { Plus, RefreshCw, UserCheck, X } from 'lucide-react';
import { api } from '../lib/api.js';

const STATUS_COLOR = { active: 'green', ended: 'gray' };

const TARGET_ROLES = [
  { value: 'practice_admin',  label: 'Practice Admin' },
  { value: 'practice_owner',  label: 'Practice Owner' },
  { value: 'counselor',       label: 'Counselor' },
  { value: 'scheduler_biller', label: 'Scheduler / Biller' },
];

export default function ImpersonationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ending, setEnding] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [form, setForm] = useState({ targetTenantId: '', targetRole: 'practice_admin', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = () => {
    setLoading(true);
    api.listImpersonationSessions()
      .then((data) => setItems(data?.items ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStart = async () => {
    setFormError(null);
    if (!form.targetTenantId.trim()) { setFormError('Target tenant ID is required.'); return; }
    if (form.reason.trim().length < 10) { setFormError('Reason must be at least 10 characters.'); return; }
    setSaving(true);
    try {
      await api.startImpersonationSession(form.targetTenantId.trim(), form.targetRole, form.reason.trim());
      setStartOpen(false);
      setForm({ targetTenantId: '', targetRole: 'practice_admin', reason: '' });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async (id) => {
    setEnding(id);
    try {
      await api.endImpersonationSession(id);
      setItems((prev) => prev.map((s) => s.id === id ? { ...s, status: 'ended', endedAt: new Date().toISOString() } : s));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnding(null);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <UserCheck size={20} />
          <Title order={2}>Impersonation Sessions</Title>
        </Group>
        <Group gap="xs">
          <Button leftSection={<RefreshCw size={14} />} variant="light" onClick={load} loading={loading}>
            Refresh
          </Button>
          <Button leftSection={<Plus size={14} />} onClick={() => { setFormError(null); setStartOpen(true); }}>
            Start Session
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="md" bg="yellow.0">
        <Text size="sm">
          Impersonation sessions allow platform admins to log in as a tenant user for support
          purposes. All sessions are audit-logged with the reason and your identity.
          End sessions immediately after support work is complete.
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
              <Table.Th>Role</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Started by</Table.Th>
              <Table.Th>Started at</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((session) => {
              const targetTenant = session.targetTenantId ?? session.target_tenant_id ?? '—';
              const targetRole   = session.targetRole    ?? session.target_role    ?? '—';
              const requestedBy  = session.requestedBy   ?? session.requested_by  ?? '—';
              const startedAt    = session.startedAt     ?? session.started_at    ?? '—';
              const isActive = session.status === 'active';
              return (
                <Table.Tr key={session.id}>
                  <Table.Td><Text size="sm" ff="monospace">{targetTenant}</Text></Table.Td>
                  <Table.Td><Text size="sm">{targetRole}</Text></Table.Td>
                  <Table.Td><Text size="sm" lineClamp={2} maw={260}>{session.reason ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{requestedBy}</Text></Table.Td>
                  <Table.Td><Text size="xs">{startedAt}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[session.status] ?? 'gray'} variant="light">
                      {session.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {isActive && (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<X size={12} />}
                        loading={ending === session.id}
                        onClick={() => handleEnd(session.id)}
                      >
                        End
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start Impersonation Session"
        centered
      >
        <Stack gap="md">
          <Alert color="orange" variant="light">
            This action is audit-logged. Provide a clear, documented reason for access.
          </Alert>

          {formError && <Alert color="red">{formError}</Alert>}

          <TextInput
            label="Target tenant ID"
            placeholder="e.g. grace-counseling"
            value={form.targetTenantId}
            onChange={(e) => setForm((f) => ({ ...f, targetTenantId: e.currentTarget.value }))}
            data-autofocus
          />

          <Select
            label="Role to assume"
            data={TARGET_ROLES}
            value={form.targetRole}
            onChange={(v) => setForm((f) => ({ ...f, targetRole: v ?? 'practice_admin' }))}
            allowDeselect={false}
          />

          <Textarea
            label="Reason for access"
            description="Minimum 10 characters. This is recorded in the audit log."
            placeholder="e.g. Tenant reported billing discrepancy — investigating claim records per support ticket #1234"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.currentTarget.value }))}
            minRows={3}
            maxLength={600}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setStartOpen(false)}>Cancel</Button>
            <Button color="orange" onClick={handleStart} loading={saving}>Start Session</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
