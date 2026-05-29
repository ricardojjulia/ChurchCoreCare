import { useEffect, useState } from 'react';
import {
  Stack, Textarea, Select, Button, Group, Text, Collapse, Loader, Alert,
} from '@mantine/core';
import { csrfHeaders } from '../../lib/csrf.js';

const FORMAT_OPTIONS = [
  { value: 'SOAP', label: 'SOAP' },
  { value: 'DAP', label: 'DAP' },
  { value: 'BIRP', label: 'BIRP' },
];

export default function GroupSessionNotesForm({ sessionId, members = [], onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [noteFormat, setNoteFormat] = useState('SOAP');
  const [sharedNote, setSharedNote] = useState('');
  const [memberNotes, setMemberNotes] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetch(`/api/v1/groups/sessions/${sessionId}/notes`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data) => {
        setSharedNote(data.sharedNote?.sharedNote ?? '');
        setNoteFormat(data.sharedNote?.noteFormat ?? 'SOAP');
        const mn = {};
        for (const n of (data.memberNotes ?? [])) {
          mn[n.clientId] = n.individualNote ?? '';
        }
        setMemberNotes(mn);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        sharedNote,
        noteFormat,
        memberNotes: Object.entries(memberNotes)
          .filter(([, note]) => note?.trim())
          .map(([clientId, individualNote]) => ({ clientId, individualNote })),
      };
      const res = await fetch(`/api/v1/groups/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader size="sm" />;

  return (
    <Stack gap="md">
      {error && <Alert color="red">{error}</Alert>}

      <Select
        label="Note format"
        data={FORMAT_OPTIONS}
        value={noteFormat}
        onChange={(v) => setNoteFormat(v ?? 'SOAP')}
        size="sm"
        style={{ width: 140 }}
        allowDeselect={false}
      />

      <Textarea
        label="Shared group note"
        description="Visible to all counselors with access to this group."
        placeholder="Write the shared session note here…"
        value={sharedNote}
        onChange={(e) => setSharedNote(e.currentTarget.value)}
        minRows={5}
        autosize
        maxRows={20}
        maxLength={8000}
      />

      {members.length > 0 && (
        <Stack gap="xs">
          <Text fz="sm" fw={600}>Individual member notes</Text>
          <Text fz="xs" c="dimmed">Only visible to counselors with access to each client.</Text>
          {members.map((m) => (
            <Stack key={m.clientId} gap={4}>
              <Text
                fz="xs"
                fw={600}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-blue-6)' }}
                onClick={() => setExpanded((prev) => ({ ...prev, [m.clientId]: !prev[m.clientId] }))}
              >
                {expanded[m.clientId] ? '▾' : '▸'} {m.clientId}
              </Text>
              <Collapse in={Boolean(expanded[m.clientId])}>
                <Textarea
                  placeholder="Individual note (leave blank to skip)…"
                  value={memberNotes[m.clientId] ?? ''}
                  onChange={(e) => setMemberNotes((prev) => ({ ...prev, [m.clientId]: e.currentTarget.value }))}
                  minRows={3}
                  maxLength={5000}
                />
              </Collapse>
            </Stack>
          ))}
        </Stack>
      )}

      <Group justify="flex-end">
        <Button onClick={handleSave} loading={saving}>Save Notes</Button>
      </Group>
    </Stack>
  );
}
