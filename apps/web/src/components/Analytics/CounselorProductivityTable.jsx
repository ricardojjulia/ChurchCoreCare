import { useState } from 'react';
import { Paper, Text, Table, Skeleton, UnstyledButton, Group } from '@mantine/core';
import { ChevronUp, ChevronDown } from 'lucide-react';

const COLS = [
  { key: 'counselorId', label: 'Counselor ID' },
  { key: 'totalSessions', label: 'Sessions' },
  { key: 'completed', label: 'Completed' },
  { key: 'noShows', label: 'No-Shows' },
  { key: 'noShowRate', label: 'NS Rate %' },
  { key: 'avgDurationMinutes', label: 'Avg Min' },
];

function SortHeader({ label, active, dir, onClick }) {
  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
      <Group gap={4} wrap="nowrap">
        <Text fz="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.06em' }}>{label}</Text>
        {active ? (dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
      </Group>
    </UnstyledButton>
  );
}

export default function CounselorProductivityTable({ data, loading }) {
  const [sortKey, setSortKey] = useState('totalSessions');
  const [sortDir, setSortDir] = useState('desc');

  if (loading) return <Skeleton height={200} radius="lg" />;

  const rows = [...(data?.counselors ?? [])].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <Paper withBorder radius="lg" p="lg">
      <Text fw={600} mb="md">Counselor Productivity</Text>
      {rows.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No counselor data for this period.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {COLS.map((col) => (
                <Table.Th key={col.key}>
                  <SortHeader
                    label={col.label}
                    active={sortKey === col.key}
                    dir={sortDir}
                    onClick={() => handleSort(col.key)}
                  />
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.counselorId}>
                <Table.Td fz="xs" c="dimmed">{r.counselorId}</Table.Td>
                <Table.Td>{r.totalSessions}</Table.Td>
                <Table.Td>{r.completed}</Table.Td>
                <Table.Td>{r.noShows}</Table.Td>
                <Table.Td>{r.noShowRate}%</Table.Td>
                <Table.Td>{r.avgDurationMinutes ?? '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
