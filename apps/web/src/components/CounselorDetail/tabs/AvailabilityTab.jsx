import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Stack, Title, Table, Text, Badge, Loader, Group } from '@mantine/core';
import { fetchStaffAvailability } from '../../../lib/clientApi.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${suffix}`;
}

export default function AvailabilityTab({ staffId }) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStaffAvailability(staffId)
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : (data.items ?? data.slots ?? []);
        setSlots([...raw].sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)));
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          notifications.show({ title: 'Error', message: err.message, color: 'red' });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [staffId]);

  if (loading) return <Group justify="center" py="xl"><Loader size="sm" /></Group>;

  return (
    <Stack gap="md" maw={600}>
      <Title order={4}>Weekly Availability</Title>

      {slots.length === 0 ? (
        <Text c="dimmed" fz="sm">No availability template on file.</Text>
      ) : (
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Day</Table.Th>
              <Table.Th>Start</Table.Th>
              <Table.Th>End</Table.Th>
              <Table.Th>Mode</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {slots.map((slot, i) => (
              <Table.Tr key={i}>
                <Table.Td fw={500}>{DAY_NAMES[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}</Table.Td>
                <Table.Td>{formatTime(slot.startTime)}</Table.Td>
                <Table.Td>{formatTime(slot.endTime)}</Table.Td>
                <Table.Td>
                  <Badge size="xs" color={slot.remoteAvailable ? 'teal' : 'gray'} variant="light">
                    {slot.remoteAvailable ? 'Remote / Telehealth' : 'In-Person'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Text fz="xs" c="dimmed">Availability editing is managed through Scheduling.</Text>
    </Stack>
  );
}
