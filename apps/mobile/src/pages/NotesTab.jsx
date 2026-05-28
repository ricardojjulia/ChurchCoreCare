import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Select, Stack, Text, Textarea, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CheckCircle } from 'lucide-react';
import { api } from '../lib/api.js';

const FORMATS = [
  { value: 'SOAP', label: 'SOAP' },
  { value: 'DAP', label: 'DAP' },
  { value: 'BIRP', label: 'BIRP' },
  { value: 'FAITH_INTEGRATED', label: 'Faith Integrated' },
];

function draftKey(clientId) {
  return `note-draft-${clientId}`;
}

function useDraft(clientId, content) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem(draftKey(clientId), content);
      } else {
        localStorage.removeItem(draftKey(clientId));
      }
    }, 10_000);
    return () => clearTimeout(timerRef.current);
  }, [clientId, content]);

  const loadDraft = (cid) => localStorage.getItem(draftKey(cid)) ?? '';
  const clearDraft = (cid) => localStorage.removeItem(draftKey(cid));

  return { loadDraft, clearDraft };
}

export default function NotesTab({ clients = [] }) {
  const [clientId, setClientId] = useState('');
  const [format, setFormat] = useState('SOAP');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loadDraft, clearDraft } = useDraft(clientId, content);

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.fullName ?? c.first_name ?? c.id,
  }));

  const handleClientChange = (id) => {
    setClientId(id ?? '');
    setContent(id ? loadDraft(id) : '');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!clientId) { setError('Select a client'); return; }
    if (!content.trim()) { setError('Note content is required'); return; }

    setLoading(true);
    setError(null);
    try {
      await api.createProgressNote(clientId, {
        noteFormat: format,
        content: content.trim(),
      });
      clearDraft(clientId);
      setContent('');
      notifications.show({
        title: 'Note saved',
        message: 'Progress note added to the client chart.',
        color: 'green',
        icon: <CheckCircle size={16} />,
      });
    } catch (err) {
      setError(err.message ?? 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p="md">
      <Title order={4} mb="md">Quick Note</Title>
      <Stack gap="sm">
        <Select
          label="Client"
          placeholder="Select client…"
          data={clientOptions}
          value={clientId}
          onChange={handleClientChange}
          searchable
          clearable
        />
        <Select
          label="Format"
          data={FORMATS}
          value={format}
          onChange={(v) => setFormat(v ?? 'SOAP')}
        />
        <Textarea
          label="Session notes"
          placeholder="Enter session notes…"
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          minRows={8}
          maxLength={5000}
          autosize
        />
        <Text size="xs" c="dimmed" ta="right">{content.length}/5000</Text>

        {error && <Alert color="red" variant="light" radius="md">{error}</Alert>}

        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Save Note
        </Button>
      </Stack>
    </Box>
  );
}
