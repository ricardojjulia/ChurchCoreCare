import { useState, useEffect } from 'react';
import {
  Stack, Group, Button, Badge, Switch, Select, MultiSelect, Divider, Text,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { Trash2 } from 'lucide-react';
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

const SLOT_DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '50', label: '50 min' },
];

const BUFFER_OPTIONS = [
  { value: '0',  label: 'No buffer' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
];

const ADVANCE_BOOKING_OPTIONS = [
  { value: '7',  label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
];

const MIN_NOTICE_OPTIONS = [
  { value: '2',  label: '2 hours' },
  { value: '4',  label: '4 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
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
  enabled: false,
  slotDurationMinutes: '30',
  bufferMinutes: '0',
  advanceBookingDays: '14',
  minNoticeHours: '24',
  availableApptTypes: [],
  availabilityBlocks: [],
};

function emptyBlock() {
  return { dayOfWeek: '1', startTime: '09:00', endTime: '17:00' };
}

export default function SchedulingProfileTab({ staffId, currentUser }) {
  const role = currentUser?.role ?? null;
  const isSelf = currentUser?.staffMemberId === staffId || currentUser?.staffId === staffId;
  const canEdit = ['counselor', 'practice_admin', 'practice_owner', 'platform_admin'].includes(role);
  const readOnly = role === 'counselor' && !isSelf;

  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    apiFetch(`/api/v1/staff/${staffId}/scheduling-profile`)
      .then((payload) => {
        if (cancelled) return;
        const data = payload.item ?? payload;
        setDraft({
          enabled:              Boolean(data.enabled),
          slotDurationMinutes:  String(data.slotDurationMinutes  ?? '30'),
          bufferMinutes:        String(data.bufferMinutes         ?? '0'),
          advanceBookingDays:   String(data.advanceBookingDays   ?? '14'),
          minNoticeHours:       String(data.minNoticeHours       ?? '24'),
          availableApptTypes:   Array.isArray(data.availableApptTypes)  ? data.availableApptTypes  : [],
          availabilityBlocks:   Array.isArray(data.availabilityBlocks)  ? data.availabilityBlocks.map((b) => ({
            dayOfWeek:  String(b.dayOfWeek ?? '1'),
            startTime:  b.startTime ?? '09:00',
            endTime:    b.endTime   ?? '17:00',
          })) : [],
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
  }, [staffId, canEdit]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function updateBlock(index, field, value) {
    setDraft((prev) => {
      const blocks = prev.availabilityBlocks.map((b, i) =>
        i === index ? { ...b, [field]: value } : b,
      );
      return { ...prev, availabilityBlocks: blocks };
    });
    setDirty(true);
  }

  function addBlock() {
    setDraft((prev) => ({
      ...prev,
      availabilityBlocks: [...prev.availabilityBlocks, emptyBlock()],
    }));
    setDirty(true);
  }

  function removeBlock(index) {
    setDraft((prev) => ({
      ...prev,
      availabilityBlocks: prev.availabilityBlocks.filter((_, i) => i !== index),
    }));
    setDirty(true);
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await apiFetch(`/api/v1/staff/${staffId}/scheduling-profile`, {
        method: 'PUT',
        headers: csrfHeaders(),
        body: JSON.stringify({
          enabled:             draft.enabled,
          slotDurationMinutes: Number(draft.slotDurationMinutes),
          bufferMinutes:       Number(draft.bufferMinutes),
          advanceBookingDays:  Number(draft.advanceBookingDays),
          minNoticeHours:      Number(draft.minNoticeHours),
          availableApptTypes:  draft.availableApptTypes,
          availabilityBlocks:  draft.availabilityBlocks.map((b) => ({
            dayOfWeek:  Number(b.dayOfWeek),
            startTime:  b.startTime,
            endTime:    b.endTime,
          })),
        }),
      });
      setDirty(false);
      notifications.show({ title: 'Saved', message: 'Scheduling profile saved', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;
  if (loading) return <SurfaceState type="loading" message="Loading scheduling profile…" />;
  if (error)   return <SurfaceState type="error" title="Unable to load scheduling profile" message={error} />;

  return (
    <Stack gap="md">
      <SectionSurface>
        <SectionHeader
          title="Self-Scheduling Configuration"
          description="Configure how clients can self-book appointments with this counselor."
        />
        <Divider mb="md" />
        <Stack gap="sm">
          <Switch
            label="Allow clients to self-book appointments"
            checked={draft.enabled}
            onChange={(e) => update('enabled', e.currentTarget.checked)}
            disabled={readOnly}
          />

          <Group grow>
            <Select
              label="Slot duration"
              data={SLOT_DURATION_OPTIONS}
              value={draft.slotDurationMinutes}
              onChange={(v) => update('slotDurationMinutes', v ?? '30')}
              disabled={readOnly}
            />
            <Select
              label="Buffer between slots"
              data={BUFFER_OPTIONS}
              value={draft.bufferMinutes}
              onChange={(v) => update('bufferMinutes', v ?? '0')}
              disabled={readOnly}
            />
          </Group>

          <Group grow>
            <Select
              label="Advance booking window"
              data={ADVANCE_BOOKING_OPTIONS}
              value={draft.advanceBookingDays}
              onChange={(v) => update('advanceBookingDays', v ?? '14')}
              disabled={readOnly}
            />
            <Select
              label="Minimum notice required"
              data={MIN_NOTICE_OPTIONS}
              value={draft.minNoticeHours}
              onChange={(v) => update('minNoticeHours', v ?? '24')}
              disabled={readOnly}
            />
          </Group>

          <MultiSelect
            label="Available appointment types"
            description="Leave empty to allow all types from the practice profile."
            data={APPT_TYPE_OPTIONS}
            value={draft.availableApptTypes}
            onChange={(v) => update('availableApptTypes', v)}
            disabled={readOnly}
            searchable
            clearable
          />
        </Stack>
      </SectionSurface>

      <SectionSurface>
        <SectionHeader
          title="Availability Blocks"
          description="Define the weekly windows when clients can book slots."
        />
        <Divider mb="md" />
        <Stack gap="xs">
          {draft.availabilityBlocks.length === 0 && (
            <Text fz="sm" c="dimmed">No availability blocks defined. Add a block to open time slots.</Text>
          )}
          {draft.availabilityBlocks.map((block, index) => (
            <Group key={index} gap="sm" align="flex-end" wrap="nowrap">
              <Select
                label={index === 0 ? 'Day' : undefined}
                data={DAY_OPTIONS}
                value={block.dayOfWeek}
                onChange={(v) => updateBlock(index, 'dayOfWeek', v ?? '1')}
                disabled={readOnly}
                style={{ minWidth: 140 }}
              />
              <TimeInput
                label={index === 0 ? 'Start' : undefined}
                value={block.startTime}
                onChange={(e) => updateBlock(index, 'startTime', e.currentTarget.value)}
                disabled={readOnly}
                style={{ minWidth: 110 }}
              />
              <TimeInput
                label={index === 0 ? 'End' : undefined}
                value={block.endTime}
                onChange={(e) => updateBlock(index, 'endTime', e.currentTarget.value)}
                disabled={readOnly}
                style={{ minWidth: 110 }}
              />
              {!readOnly && (
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  px="xs"
                  onClick={() => removeBlock(index)}
                  aria-label="Remove block"
                  style={{ marginBottom: index === 0 ? 0 : undefined }}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </Group>
          ))}
          {!readOnly && (
            <Button variant="light" size="xs" onClick={addBlock} mt="xs">
              + Add block
            </Button>
          )}
        </Stack>
      </SectionSurface>

      {!readOnly && (
        <Group justify="flex-end" mt="xs">
          {dirty && <Badge color="yellow" variant="light">Unsaved changes</Badge>}
          <Button onClick={save} loading={saving} disabled={!dirty || saving}>
            Save scheduling profile
          </Button>
        </Group>
      )}
    </Stack>
  );
}
