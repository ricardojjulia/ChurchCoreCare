import { useEffect, useState } from 'react';
import {
  Stack, Paper, Title, Text, Group, Button, TextInput,
  Alert, Loader, SimpleGrid, Badge, Modal,
} from '@mantine/core';
import { Plus, Users } from 'lucide-react';
import { csrfHeaders } from '../../lib/csrf.js';

function GroupCard({ group, onSelect }) {
  return (
    <Paper withBorder radius="lg" p="md" style={{ cursor: 'pointer' }} onClick={() => onSelect(group)}>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text fw={600}>{group.name}</Text>
          <Text fz="xs" c="dimmed">{group.members?.length ?? 0} member(s)</Text>
        </Stack>
        <Badge color={group.isActive ? 'teal' : 'gray'} size="sm" variant="light">
          {group.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </Group>
    </Paper>
  );
}

export default function GroupsPage({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/groups', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setGroups(json.items ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify({ name: newName.trim() }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCreateOpen(false);
      setNewName('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Stack p="md" gap="md">
      <Paper
        radius="xl" p="xl"
        style={{
          background: 'radial-gradient(circle at top left, rgba(129,140,248,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,244,255,0.94))',
          border: '1px solid rgba(79,70,229,0.12)',
          boxShadow: '0 20px 50px rgba(34,51,93,0.08)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="indigo" style={{ letterSpacing: '0.12em', marginBottom: 6 }}>
              Group & Family Therapy
            </Text>
            <Title order={2}>Therapy Groups</Title>
            <Text c="dimmed" size="sm" mt={4}>Manage group programs and recurring sessions.</Text>
          </div>
          <Button leftSection={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            New Group
          </Button>
        </Group>
      </Paper>

      {error && <Alert color="red">{error}</Alert>}

      {loading ? (
        <Loader size="sm" />
      ) : groups.length === 0 ? (
        <Paper withBorder p="xl" radius="lg" ta="center">
          <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <Text c="dimmed" fz="sm">No groups yet. Create one to get started.</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onSelect={onSelectGroup} />
          ))}
        </SimpleGrid>
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Create Therapy Group" centered>
        <Stack gap="md">
          <TextInput
            label="Group name"
            placeholder="e.g. Tuesday Grief Group"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
