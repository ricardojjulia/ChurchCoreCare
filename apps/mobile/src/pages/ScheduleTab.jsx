import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Badge, Box, Card, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function appointmentLabel(type) {
  return (type ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status) {
  if (status === 'checked_in' || status === 'in_progress') return 'green';
  if (status === 'completed') return 'gray';
  if (status === 'cancelled' || status === 'no_show') return 'red';
  return 'blue';
}

function isPast(endsAt) {
  return endsAt && new Date(endsAt) < new Date();
}

export default function ScheduleTab({ onSelectClient }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAppointments({ date: todayIso() });
      const sorted = (data.items ?? []).sort((a, b) =>
        (a.startsAt ?? '').localeCompare(b.startsAt ?? ''),
      );
      setItems(sorted);
    } catch (err) {
      setError(err.message ?? 'Could not load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Box p="md">
      <Stack gap="xs" mb="md">
        <Title order={4}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Title>
        <Text size="sm" c="dimmed">{items.length} appointment{items.length !== 1 ? 's' : ''} today</Text>
      </Stack>

      {loading && (
        <Center py="xl"><Loader size="sm" /></Center>
      )}

      {!loading && error && (
        <Text c="red" size="sm">{error}</Text>
      )}

      {!loading && !error && items.length === 0 && (
        <Center py="xl">
          <Text c="dimmed" size="sm">No appointments today</Text>
        </Center>
      )}

      <Stack gap="sm">
        {items.map((appt) => (
          <Card
            key={appt.id}
            withBorder
            radius="md"
            p="sm"
            style={{
              opacity: isPast(appt.endsAt) ? 0.55 : 1,
              cursor: appt.clientId ? 'pointer' : 'default',
            }}
            onClick={() => appt.clientId && onSelectClient?.(appt.clientId)}
          >
            <Stack gap={4}>
              <Text fw={600} size="sm" lineClamp={1}>
                {appt.clientName ?? 'Client'}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTime(appt.startsAt)} – {formatTime(appt.endsAt)}
                {appt.locationName ? ` · ${appt.locationName}` : ''}
              </Text>
              <Badge size="xs" color={statusColor(appt.status)} variant="light" w="fit-content">
                {appt.status ?? 'scheduled'}
              </Badge>
              <Text size="xs" c="dimmed">{appointmentLabel(appt.appointmentType)}</Text>
            </Stack>
          </Card>
        ))}
      </Stack>

      {!loading && (
        <Center mt="lg">
          <ActionIcon variant="subtle" color="blue" onClick={load} title="Refresh">
            <RefreshCw size={16} />
          </ActionIcon>
        </Center>
      )}
    </Box>
  );
}
