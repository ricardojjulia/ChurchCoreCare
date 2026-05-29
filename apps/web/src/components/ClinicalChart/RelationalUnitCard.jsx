import { useEffect, useState } from 'react';
import { Badge, Group, Paper, Stack, Text, Anchor } from '@mantine/core';

const UNIT_COLORS = { couple: 'pink', family: 'violet', other: 'gray' };

export default function RelationalUnitCard({ clientId }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/relational-units`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : { items: [] })
      .then((data) => setUnits(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading || units.length === 0) return null;

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Text fz="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
          Relational Units
        </Text>
        {units.map((u) => (
          <Group key={u.id} gap="sm" align="center">
            <Badge color={UNIT_COLORS[u.unitType] ?? 'gray'} variant="light" size="sm">
              {u.unitType}
            </Badge>
            <Text fz="sm">{u.label}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
