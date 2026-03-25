import { useState, useEffect, useRef } from 'react';
import { Modal, TextInput, Text, Stack, UnstyledButton, Badge, Loader, Group } from '@mantine/core';

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

function resolveClientFullName(client) {
  const firstName = firstString(client?.firstName, client?.first_name);
  const lastName  = firstString(client?.lastName,  client?.last_name);
  const combined  = `${firstName} ${lastName}`.trim();
  return firstString(client?.fullName, client?.full_name, client?.name, combined, client?.preferredName, client?.preferred_name);
}

export default function ClientPickerModal({ isOpen, clients, loading, onSelectClient, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [isOpen]);

  const normalized = query.toLowerCase().trim();
  const filtered = (clients || []).filter((c) => {
    const name = resolveClientFullName(c).toLowerCase();
    return !normalized || name.includes(normalized);
  });

  return (
    <Modal opened={isOpen} onClose={onClose} title="Open Client" size="sm">
      <Stack gap="sm">
        <TextInput
          ref={inputRef}
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading ? (
          <Group justify="center" py="md"><Loader size="sm" /></Group>
        ) : filtered.length === 0 ? (
          <Text fz="sm" c="dimmed" ta="center" py="md">
            {query ? 'No clients match your search.' : 'No clients found.'}
          </Text>
        ) : (
          <Stack gap={4} style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {filtered.map((c) => {
              const fullName = resolveClientFullName(c) || `Client #${c.id}`;
              return (
                <UnstyledButton
                  key={c.id}
                  onClick={() => { onSelectClient(c.id); onClose(); }}
                  p="xs"
                  style={(theme) => ({
                    borderRadius: theme.radius.md,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': { background: theme.colors.gray[0] },
                  })}
                >
                  <Text fz="sm" fw={500}>{fullName}</Text>
                  {c.status && <Badge size="xs" variant="light">{c.status}</Badge>}
                </UnstyledButton>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
