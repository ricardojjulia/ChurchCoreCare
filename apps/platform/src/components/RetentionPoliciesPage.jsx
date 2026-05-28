import { useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Checkbox, Group, Loader,
  Modal, Select, Stack, Text, Title,
} from '@mantine/core';
import { Edit, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';

const SCHEDULE_OPTIONS = [
  { value: '7_years',    label: '7 years' },
  { value: '10_years',   label: '10 years' },
  { value: 'indefinite', label: 'Indefinite' },
];

function scheduleLabel(value) {
  return SCHEDULE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '—';
}

function PolicyRow({ label, value }) {
  return (
    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Badge variant="light" color="blue">{scheduleLabel(value)}</Badge>
    </Group>
  );
}

export default function RetentionPoliciesPage() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    clinicalRecordsSchedule: '10_years',
    billingSchedule: '7_years',
    auditLogSchedule: 'indefinite',
    includeDocumentVersions: true,
    legalHoldEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = () => {
    setLoading(true);
    api.getRetentionPolicy()
      .then((data) => {
        const p = data?.item ?? null;
        setPolicy(p);
        if (p) {
          setForm({
            clinicalRecordsSchedule: p.clinicalRecordsSchedule ?? p.clinical_records_schedule ?? '10_years',
            billingSchedule:         p.billingSchedule         ?? p.billing_schedule          ?? '7_years',
            auditLogSchedule:        p.auditLogSchedule        ?? p.audit_log_schedule        ?? 'indefinite',
            includeDocumentVersions: p.includeDocumentVersions ?? p.include_document_versions ?? true,
            legalHoldEnabled:        p.legalHoldEnabled        ?? p.legal_hold_enabled        ?? false,
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    setFormError(null);
    setSaving(true);
    try {
      const data = await api.upsertRetentionPolicy(form);
      setPolicy(data?.item ?? null);
      setEditOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setFormError(null);
    if (policy) {
      setForm({
        clinicalRecordsSchedule: policy.clinicalRecordsSchedule ?? policy.clinical_records_schedule ?? '10_years',
        billingSchedule:         policy.billingSchedule         ?? policy.billing_schedule          ?? '7_years',
        auditLogSchedule:        policy.auditLogSchedule        ?? policy.audit_log_schedule        ?? 'indefinite',
        includeDocumentVersions: policy.includeDocumentVersions ?? policy.include_document_versions ?? true,
        legalHoldEnabled:        policy.legalHoldEnabled        ?? policy.legal_hold_enabled        ?? false,
      });
    }
    setEditOpen(true);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <ShieldCheck size={20} />
          <Title order={2}>Retention Policies</Title>
        </Group>
        <Button leftSection={<Edit size={14} />} variant="light" onClick={openEdit}>
          Edit Policy
        </Button>
      </Group>

      <Text size="sm" c="dimmed">
        Retention policies define how long clinical, billing, and audit data is kept.
        Legal hold prevents deletion regardless of schedule. Changes are audit-logged.
      </Text>

      {error && <Alert color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Loader />
      ) : !policy ? (
        <Card withBorder radius="md" p="lg">
          <Stack gap="sm" align="center">
            <Text c="dimmed">No retention policy configured for this tenant.</Text>
            <Button onClick={openEdit}>Configure Policy</Button>
          </Stack>
        </Card>
      ) : (
        <Card withBorder radius="md" p="lg">
          <Stack gap={0}>
            <PolicyRow label="Clinical records" value={policy.clinicalRecordsSchedule ?? policy.clinical_records_schedule} />
            <PolicyRow label="Billing records"  value={policy.billingSchedule         ?? policy.billing_schedule} />
            <PolicyRow label="Audit log"         value={policy.auditLogSchedule        ?? policy.audit_log_schedule} />
            <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Text size="sm" c="dimmed">Include document versions</Text>
              <Badge variant="light" color={(policy.includeDocumentVersions ?? policy.include_document_versions) ? 'teal' : 'gray'}>
                {(policy.includeDocumentVersions ?? policy.include_document_versions) ? 'Yes' : 'No'}
              </Badge>
            </Group>
            <Group justify="space-between" py="xs">
              <Text size="sm" c="dimmed">Legal hold</Text>
              <Badge variant="light" color={(policy.legalHoldEnabled ?? policy.legal_hold_enabled) ? 'red' : 'gray'}>
                {(policy.legalHoldEnabled ?? policy.legal_hold_enabled) ? 'ENABLED' : 'Disabled'}
              </Badge>
            </Group>
          </Stack>
        </Card>
      )}

      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Retention Policy"
        centered
      >
        <Stack gap="md">
          {formError && <Alert color="red">{formError}</Alert>}

          <Select
            label="Clinical records retention"
            data={SCHEDULE_OPTIONS}
            value={form.clinicalRecordsSchedule}
            onChange={(v) => setForm((f) => ({ ...f, clinicalRecordsSchedule: v ?? '10_years' }))}
            allowDeselect={false}
          />

          <Select
            label="Billing records retention"
            data={SCHEDULE_OPTIONS}
            value={form.billingSchedule}
            onChange={(v) => setForm((f) => ({ ...f, billingSchedule: v ?? '7_years' }))}
            allowDeselect={false}
          />

          <Select
            label="Audit log retention"
            data={SCHEDULE_OPTIONS}
            value={form.auditLogSchedule}
            onChange={(v) => setForm((f) => ({ ...f, auditLogSchedule: v ?? 'indefinite' }))}
            allowDeselect={false}
          />

          <Checkbox
            label="Include document versions in exports"
            checked={form.includeDocumentVersions}
            onChange={(e) => setForm((f) => ({ ...f, includeDocumentVersions: e.currentTarget.checked }))}
          />

          <Checkbox
            label="Legal hold (prevents all deletion)"
            checked={form.legalHoldEnabled}
            onChange={(e) => setForm((f) => ({ ...f, legalHoldEnabled: e.currentTarget.checked }))}
            color="red"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Policy</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
