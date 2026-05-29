import { useEffect, useRef, useState } from 'react';
import { Box, Card, Center, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { Search, User } from 'lucide-react';
import { api } from '../lib/api.js';

function ClientCard({ client }) {
  const webUrl = `${import.meta.env.VITE_WEB_URL ?? ''}/clients/${client.id}`;
  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap={4}>
        <Text fw={600} size="sm">{client.fullName ?? client.first_name ?? 'Client'}</Text>
        {client.dateOfBirth && (
          <Text size="xs" c="dimmed">
            DOB: {new Date(client.dateOfBirth).toLocaleDateString()}
          </Text>
        )}
        {client.counselorName && (
          <Text size="xs" c="dimmed">Counselor: {client.counselorName}</Text>
        )}
        {client.status && (
          <Text size="xs" c="dimmed">Status: {client.status}</Text>
        )}
        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          component="a"
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open full chart →
        </Text>
      </Stack>
    </Card>
  );
}

export default function ClientsTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.searchClients(query.trim());
        setResults(data.items ?? data.clients ?? []);
        setSearched(true);
      } catch (err) {
        setError(err.message ?? 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <Box p="md">
      <Title order={4} mb="sm">Clients</Title>
      <TextInput
        placeholder="Search by name…"
        leftSection={<Search size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        mb="md"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />

      {loading && <Center py="md"><Loader size="sm" /></Center>}

      {!loading && error && <Text c="red" size="sm">{error}</Text>}

      {!loading && searched && results.length === 0 && (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <User size={32} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" size="sm">No clients found</Text>
          </Stack>
        </Center>
      )}

      {!loading && !searched && !query && (
        <Center py="xl">
          <Text c="dimmed" size="sm">Search for a client by name</Text>
        </Center>
      )}

      <Stack gap="sm">
        {results.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </Stack>
    </Box>
  );
}
