import { useState, useEffect, useCallback } from 'react';
import {
  Stack, Group, Button, Select, Alert, Modal, Text, Title, Paper,
  Badge, Skeleton,
} from '@mantine/core';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { csrfHeaders } from '../../../lib/csrf.js';

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

function getClientTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { return null; }
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDayButton(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatSlotInTz(iso, tz) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz,
    timeZoneName: 'short',
  });
}

function formatSlotLong(iso, tz) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz,
    timeZoneName: 'short',
  });
}

function SlotSkeleton() {
  return (
    <Stack gap="xs">
      {[1, 2, 3].map((n) => <Skeleton key={n} height={40} radius="sm" />)}
    </Stack>
  );
}

export default function PortalSchedulingTab({ effectiveClientId }) {
  const clientTz = getClientTz();

  const [entitlement, setEntitlement]     = useState(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);
  const [entitlementError, setEntitlementError]     = useState('');

  const [selectedApptType, setSelectedApptType] = useState('');
  const [weekStart, setWeekStart]               = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate]         = useState(null);

  const [slots, setSlots]             = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError]     = useState('');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [confirmed, setConfirmed]       = useState(null);

  const [inlineError, setInlineError]   = useState('');

  const practiceTz = entitlement?.practiceTimezone ?? null;
  const showDualTz = practiceTz && clientTz && practiceTz !== clientTz;
  const effectiveMode = entitlement?.mode ?? null;

  useEffect(() => {
    let cancelled = false;
    setEntitlementLoading(true);
    setEntitlementError('');

    const url = effectiveClientId
      ? `/api/v1/portal/scheduling/entitlement?clientId=${encodeURIComponent(effectiveClientId)}`
      : '/api/v1/portal/scheduling/entitlement';

    apiFetch(url)
      .then((payload) => {
        if (cancelled) return;
        setEntitlement(payload.item ?? payload);
      })
      .catch((err) => {
        if (cancelled) return;
        setEntitlementError(err.message);
      })
      .finally(() => { if (!cancelled) setEntitlementLoading(false); });

    return () => { cancelled = true; };
  }, [effectiveClientId]);

  const fetchSlots = useCallback(async (apptType, weekStartDate) => {
    if (!apptType) return;
    setSlotsLoading(true);
    setSlotsError('');
    setSlots([]);
    const from = isoDate(weekStartDate);
    const to   = isoDate(addDays(weekStartDate, 6));
    const params = new URLSearchParams({ from, to, apptType });
    if (effectiveClientId) params.set('clientId', effectiveClientId);
    try {
      const payload = await apiFetch(`/api/v1/portal/scheduling/slots?${params}`);
      setSlots(Array.isArray(payload.items) ? payload.items : (Array.isArray(payload) ? payload : []));
    } catch (err) {
      setSlotsError(err.message);
    } finally {
      setSlotsLoading(false);
    }
  }, [effectiveClientId]);

  useEffect(() => {
    if (selectedApptType && effectiveMode === 'book') {
      fetchSlots(selectedApptType, weekStart);
    }
  }, [selectedApptType, weekStart, effectiveMode, fetchSlots]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const slotsForDate = selectedDate
    ? slots.filter((s) => {
        const slotDate = isoDate(new Date(s.slotStart));
        return slotDate === isoDate(selectedDate);
      })
    : [];

  const hasSlotOnDay = (date) =>
    slots.some((s) => isoDate(new Date(s.slotStart)) === isoDate(date));

  function openConfirmModal(slot) {
    setSelectedSlot(slot);
    setModalOpen(true);
    setInlineError('');
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) return;
    setConfirming(true);
    try {
      const body = {
        apptType: selectedApptType,
        slotStart: selectedSlot.slotStart,
        slotEnd:   selectedSlot.slotEnd,
      };
      if (effectiveClientId) body.clientId = effectiveClientId;
      const payload = await apiFetch('/api/v1/portal/scheduling/book', {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      setModalOpen(false);
      setConfirmed(payload.item ?? payload);
      setSelectedSlot(null);
      setSelectedApptType('');
      setSelectedDate(null);
      setSlots([]);
    } catch (err) {
      setModalOpen(false);
      if (err.status === 409) {
        setInlineError('That slot was just taken — trying another slot');
        fetchSlots(selectedApptType, weekStart);
      } else {
        setInlineError(err.message || 'Unable to complete booking. Please try again.');
      }
    } finally {
      setConfirming(false);
    }
  }

  if (entitlementLoading) {
    return (
      <Stack gap="sm" mt="md">
        <Skeleton height={24} width={200} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </Stack>
    );
  }

  if (entitlementError || effectiveMode !== 'book') {
    return (
      <Alert color="blue" variant="light" icon={<Calendar size={16} />} mt="md">
        Contact your counselor to enable self-scheduling.
      </Alert>
    );
  }

  const apptTypeOptions = (entitlement?.availableApptTypes ?? []).map((t) => ({ value: t, label: t }));

  return (
    <Stack gap="md">
      {confirmed && (
        <Alert
          color="green"
          variant="light"
          icon={<CheckCircle size={16} />}
          title="Appointment booked"
          withCloseButton
          onClose={() => setConfirmed(null)}
        >
          <Text size="sm">
            {confirmed.appointmentType ?? selectedApptType}
            {confirmed.startsAt ? ` — ${formatSlotLong(confirmed.startsAt, practiceTz || clientTz)}` : ''}
            {confirmed.counselorName ? ` with ${confirmed.counselorName}` : ''}
          </Text>
        </Alert>
      )}

      {inlineError && (
        <Alert
          color={inlineError.includes('just taken') ? 'yellow' : 'red'}
          variant="light"
          icon={<AlertCircle size={16} />}
          withCloseButton
          onClose={() => setInlineError('')}
        >
          {inlineError}
        </Alert>
      )}

      <Paper withBorder radius="md" p="md">
        <Title order={4} mb="sm">Book an Appointment</Title>

        <Stack gap="md">
          <Select
            label="Appointment type"
            placeholder="Select a type to see available slots"
            data={apptTypeOptions}
            value={selectedApptType}
            onChange={(v) => {
              setSelectedApptType(v ?? '');
              setSelectedDate(null);
              setSlots([]);
            }}
            leftSection={<Clock size={16} />}
          />

          {selectedApptType && (
            <>
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text fw={600} size="sm">Select a day</Text>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => { setWeekStart((w) => addDays(w, -7)); setSelectedDate(null); }}
                    >
                      &lt;
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => { setWeekStart((w) => addDays(w, 7)); setSelectedDate(null); }}
                    >
                      &gt;
                    </Button>
                  </Group>
                </Group>

                <Group gap="xs" wrap="wrap">
                  {weekDays.map((day) => {
                    const isSelected = selectedDate && isoDate(day) === isoDate(selectedDate);
                    const hasSlots   = hasSlotOnDay(day);
                    return (
                      <Button
                        key={isoDate(day)}
                        size="xs"
                        variant={isSelected ? 'filled' : hasSlots ? 'light' : 'default'}
                        color={isSelected ? 'blue' : hasSlots ? 'teal' : 'gray'}
                        onClick={() => setSelectedDate(day)}
                        disabled={slotsLoading}
                        style={{ minWidth: 90 }}
                      >
                        {formatDayButton(day)}
                        {hasSlots && !isSelected && (
                          <Badge size="xs" color="teal" variant="filled" ml={4}>
                            {slots.filter((s) => isoDate(new Date(s.slotStart)) === isoDate(day)).length}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </Group>
              </Stack>

              {slotsLoading && <SlotSkeleton />}

              {!slotsLoading && slotsError && (
                <Alert color="red" variant="light" icon={<AlertCircle size={16} />}>
                  {slotsError}
                </Alert>
              )}

              {!slotsLoading && !slotsError && selectedDate && (
                <Stack gap="xs">
                  <Text fw={600} size="sm">
                    Available slots for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                  {slotsForDate.length === 0 ? (
                    <Text c="dimmed" size="sm">No slots available this week — try another week.</Text>
                  ) : (
                    slotsForDate.map((slot) => {
                      const practiceTime = formatSlotInTz(slot.slotStart, practiceTz || clientTz);
                      const clientTime   = showDualTz ? formatSlotInTz(slot.slotStart, clientTz) : null;
                      return (
                        <Button
                          key={slot.slotStart}
                          variant="light"
                          color="blue"
                          justify="flex-start"
                          leftSection={<Clock size={14} />}
                          onClick={() => openConfirmModal(slot)}
                        >
                          {practiceTz ? practiceTime : practiceTime}
                          {clientTime ? <Text span c="dimmed" size="sm" ml={6}>({clientTime} your time)</Text> : null}
                        </Button>
                      );
                    })
                  )}
                </Stack>
              )}

              {!slotsLoading && !slotsError && !selectedDate && slots.length === 0 && (
                <Text c="dimmed" size="sm">No slots available this week — try another week.</Text>
              )}
            </>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm booking"
        centered
      >
        {selectedSlot && (
          <Stack gap="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Appointment type</Text>
              <Text fw={600}>{selectedApptType}</Text>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" c="dimmed">Date and time</Text>
              <Text fw={600}>{formatSlotLong(selectedSlot.slotStart, practiceTz || clientTz)}</Text>
              {showDualTz && (
                <Text size="sm" c="dimmed">
                  {formatSlotLong(selectedSlot.slotStart, clientTz)} (your local time)
                </Text>
              )}
            </Stack>

            {entitlement?.counselorName && (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Counselor</Text>
                <Text fw={600}>{entitlement.counselorName}</Text>
              </Stack>
            )}

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setModalOpen(false)} disabled={confirming}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBooking}
                loading={confirming}
                leftSection={<CheckCircle size={16} />}
              >
                Confirm Booking
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
