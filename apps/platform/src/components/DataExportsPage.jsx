import { useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Group, Loader, Modal, Select,
  Stack, Table, Text, Title,
} from '@mantine/core';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';

const STATUS_COLOR = {
  queued:     'blue',
  processing: 'yellow',
  completed:  'green',
  failed:     'red',
};

const EXPORT_TYPES = [
  { value: 'clinical_records', label: 'Clinical Records' },
  { value: 'billing',          label: 'Billing' },
  { value: 'documents',        label: 'Documents' },
  { value: 'audit_log',        label: 'Audit Log' },
];

const FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv',  label: 'CSV' },
];

export default function DataExportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ exportType: 'clinical_records', format: 'json' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = () => {
    setLoading(true);
    api.listDataExports()
      .then((data) => setItems(data?.items ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRequest = async () => {
    setFormError(null);
    setSaving(true);
    try {
      await api.requestDataExport(form.exportType, form.format);
      setModalOpen(false);
      setForm({ exportType: 'clinical_records', format: 'json' });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <Download size={20} />
          <Title order={2}>Data Exports</Title>
        </Group>
        <Group gap="xs">
          <Button leftSection={<RefreshCw size={14} />} variant="light" onClick={load} loading={loading}>
            Refresh
          </Button>
          <Button leftSection={<Plus size={14} />} onClick={() => { setFormError(null); setModalOpen(true); }}>
            Request Export
          </Button>
        </Group>
      </Group>

      <Text size="sm" c="dimmed">
        Export jobs are queued and processed in the background. Completed exports are available
        for download from the worker output directory.
      </Text>

      {error && <Alert color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <Text c="dimmed">No export jobs found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Export type</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Requested by</Table.Th>
              <Table.Th>Requested at</Table.Th>
              <Table.Th>Completed at</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((job) => (
              <Table.Tr key={job.id}>
                <Table.Td><Text size="sm">{(job.exportType ?? job.export_type ?? '—').replace('_', ' ')}</Text></Table.Td>
                <Table.Td><Text size="sm" tt="uppercase">{job.format ?? '—'}</Text></Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLOR[job.status] ?? 'gray'} variant="light">
                    {job.status}
                  </Badge>
                </Table.Td>
                <Table.Td><Text size="sm">{job.requestedByRole ?? job.requested_by_role ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs">{job.requestedAt ?? job.requested_at ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs">{job.completedAt ?? job.completed_at ?? '—'}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Data Export"
        centered
      >
        <Stack gap="md">
          {formError && <Alert color="red">{formError}</Alert>}

          <Select
            label="Export type"
            data={EXPORT_TYPES}
            value={form.exportType}
            onChange={(v) => setForm((f) => ({ ...f, exportType: v ?? 'clinical_records' }))}
            allowDeselect={false}
          />

          <Select
            label="Format"
            data={FORMATS}
            value={form.format}
            onChange={(v) => setForm((f) => ({ ...f, format: v ?? 'json' }))}
            allowDeselect={false}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRequest} loading={saving}>Request Export</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
