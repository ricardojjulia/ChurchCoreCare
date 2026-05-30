import { useState, useEffect } from 'react';
import {
  Stack, Group, Button, Badge, Select, MultiSelect, Alert, Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { csrfHeaders } from '../../../lib/csrf.js';
import { SectionHeader, SectionSurface, SurfaceState } from '../../ui/surface.jsx';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const b = await res.json(); msg = b.error || b.message || msg; } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const BOOKING_MODE_OPTIONS = [
  { value: 'request', label: 'Request only (default)' },
  { value: 'book',    label: 'Real-time booking' },
];

const APPT_TYPE_OPTIONS = [
  'Initial Consultation',
  'Follow-up Session',
  'Crisis Session',
  'Couples Session',
  'Family Session',
  'Group Session',
  'Biblical Counseling',
  'Prayer-Focused Session',
  'Telehealth Session',
].map((label) => ({ value: label, label }));

const DAY_OPTIONS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const DEFAULT_DRAFT = {
  bookingMode:      'request',
  allowedApptTypes: [],
  allowedDays:      [],
  expiresAt:        null,
};

function strToDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateToIso(d) {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : String(d);
}

export default function SchedulingAuthTab({ clientId, counselorId }) {
  const [draft, setDraft]   = useState(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!clientId || !counselorId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ counselorId });
    apiFetch(`/api/v1/clients/${clientId}/booking-authorization?${params}`)
      .then((payload) => {
        if (cancelled) return;
        const data = payload.item ?? payload;
        setDraft({
          bookingMode:      data.bookingMode      ?? 'request',
          allowedApptTypes: Array.isArray(data.allowedApptTypes) ? data.allowedApptTypes : [],
          allowedDays:      Array.isArray(data.allowedDays)
            ? data.allowedDays.map(String)
            : [],
          expiresAt: strToDate(data.expiresAt),
        });
        setDirty(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) {
          setDraft(DEFAULT_DRAFT);
          setDirty(false);
        } else {
          setError(err.message);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clientId, counselorId]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await apiFetch(`/api/v1/clients/${clientId}/booking-authorization`, {
        method: 'PUT',
        headers: csrfHeaders(),
        body: JSON.stringify({
          counselorId,
          bookingMode:      draft.bookingMode,
          allowedApptTypes: draft.allowedApptTypes.length ? draft.allowedApptTypes : null,
          allowedDays:      draft.allowedDays.length ? draft.allowedDays.map(Number) : null,
          expiresAt:        dateToIso(draft.expiresAt),
        }),
      });
      setDirty(false);
      notifications.show({ title: 'Saved', message: 'Booking authorization saved', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SurfaceState type="loading" message="Loading booking authorization…" />;
  if (error)   return <SurfaceState type="error" title="Unable to load booking authorization" message={error} />;

  return (
    <Stack gap="md">
      <SectionSurface>
        <SectionHeader
          title="Client Booking Authorization"
          description="Control whether this client can self-book real-time appointments from their portal."
        />
        <Divider mb="md" />
        <Stack gap="sm">
          <Select
            label="Booking mode"
            data={BOOKING_MODE_OPTIONS}
            value={draft.bookingMode}
            onChange={(v) => update('bookingMode', v ?? 'request')}
          />

          {draft.bookingMode === 'book' && (
            <Alert color="blue" variant="light">
              Client can self-book confirmed appointments from the portal.
            </Alert>
          )}

          <MultiSelect
            label="Allowed appointment types"
            description="Leave empty to inherit all types from the counselor's scheduling profile."
            placeholder="Inherit from scheduling profile (all types)"
            data={APPT_TYPE_OPTIONS}
            value={draft.allowedApptTypes}
            onChange={(v) => update('allowedApptTypes', v)}
            searchable
            clearable
          />

          <MultiSelect
            label="Allowed days"
            description="Leave empty to inherit all days from the counselor's scheduling profile."
            placeholder="Inherit from scheduling profile (all days)"
            data={DAY_OPTIONS}
            value={draft.allowedDays}
            onChange={(v) => update('allowedDays', v)}
            clearable
          />

          <DateInput
            label="Access expiry (optional)"
            description="If set, the client's booking access will expire on this date."
            value={draft.expiresAt}
            onChange={(v) => update('expiresAt', v)}
            clearable
            placeholder="No expiry"
          />
        </Stack>
      </SectionSurface>

      <Group justify="flex-end" mt="xs">
        {dirty && <Badge color="yellow" variant="light">Unsaved changes</Badge>}
        <Button onClick={save} loading={saving} disabled={!dirty || saving}>
          Save booking authorization
        </Button>
      </Group>
    </Stack>
  );
}
