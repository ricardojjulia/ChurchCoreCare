import { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core';
import { useI18n } from '../lib/i18nContext.jsx';

function apptStatusColor(status) {
  switch (status) {
    case 'scheduled':   return 'blue';
    case 'checked_in':  return 'teal';
    case 'completed':   return 'green';
    case 'cancelled':   return 'gray';
    case 'no_show':     return 'red';
    default:            return 'gray';
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  return `${minutes} min`;
}

export default function ClientSessionsModal({ opened, clientId, clientName, onClose }) {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!opened || !clientId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAppointments([]);
    fetch(`/api/v1/appointments?clientId=${encodeURIComponent(clientId)}`, { credentials: 'include' })
      .then((res) => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        // Newest first
        items.sort((a, b) => {
          const ta = new Date(a.startsAt ?? a.scheduledAt ?? 0).getTime();
          const tb = new Date(b.startsAt ?? b.scheduledAt ?? 0).getTime();
          return tb - ta;
        });
        setAppointments(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || t('state.unableToLoad'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [opened, clientId, t]);

  const title = clientName
    ? t('clientsPage.sessionsModalTitle', { name: clientName })
    : t('clientsPage.sessionsButton');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /></Group>
      ) : error ? (
        <Alert color="red" variant="light">{error}</Alert>
      ) : appointments.length === 0 ? (
        <Text c="dimmed" py="md">{t('clientsPage.sessionsEmpty')}</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('scheduling.col.dateTime')}</Table.Th>
              <Table.Th>{t('scheduling.col.type')}</Table.Th>
              <Table.Th>{t('scheduling.col.status')}</Table.Th>
              <Table.Th>{t('scheduling.col.counselor')}</Table.Th>
              <Table.Th>{t('scheduling.col.duration')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {appointments.map((appt) => {
              const startsAt = appt.startsAt ?? appt.scheduledAt;
              const counselorName = appt.counselorName ?? appt.staffName ?? appt.counselorId ?? '—';
              const apptType = appt.appointmentType ?? appt.type ?? '—';
              return (
                <Table.Tr key={appt.id}>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(startsAt)}</Table.Td>
                  <Table.Td>{apptType}</Table.Td>
                  <Table.Td>
                    <Badge color={apptStatusColor(appt.status)} variant="light" size="sm">
                      {appt.status ?? '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{counselorName}</Table.Td>
                  <Table.Td>{formatDuration(appt.durationMinutes ?? appt.duration)}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Modal>
  );
}
