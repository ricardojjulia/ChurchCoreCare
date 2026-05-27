import { useState } from 'react';
import {
  Stack, Select, Textarea, Button, Alert, Text, Group,
} from '@mantine/core';
import { Sparkles } from 'lucide-react';
import { csrfHeaders } from '../../lib/csrf.js';

const FORMAT_OPTIONS = [
  { value: 'SOAP', label: 'SOAP (Subjective · Objective · Assessment · Plan)' },
  { value: 'DAP', label: 'DAP (Data · Assessment · Plan)' },
  { value: 'BIRP', label: 'BIRP (Behavior · Intervention · Response · Plan)' },
  { value: 'FAITH_INTEGRATED', label: 'Faith Integrated' },
];

export default function AiNoteDraftPanel({ clientId, onDraftAccepted }) {
  const [format, setFormat] = useState('SOAP');
  const [sessionContext, setSessionContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!sessionContext.trim()) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch(`/api/v1/clients/${encodeURIComponent(clientId)}/progress-notes/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ format, sessionContext: sessionContext.trim() }),
      });
      if (!res.ok) {
        let msg = `Request failed: ${res.status}`;
        try { const b = await res.json(); msg = b.error || msg; } catch (_) {}
        throw new Error(msg);
      }
      const data = await res.json();
      setDraft(data.draft);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
        AI Draft Assistant
      </Text>
      <Select
        label="Note Format"
        data={FORMAT_OPTIONS}
        value={format}
        onChange={(v) => setFormat(v ?? 'SOAP')}
        size="sm"
      />
      <Textarea
        label="Session Context (brief notes)"
        description="What happened in this session? Include presenting issues, interventions used, client response. This is not stored."
        placeholder="e.g. Client reported increased anxiety this week. Explored CBT thought records around catastrophising. Client responded well, identified three cognitive distortions…"
        value={sessionContext}
        onChange={(e) => setSessionContext(e.currentTarget.value)}
        maxLength={2000}
        autosize
        minRows={3}
        size="sm"
      />
      <Group gap="xs">
        <Button
          size="xs"
          leftSection={<Sparkles size={14} />}
          onClick={handleGenerate}
          loading={loading}
          disabled={!sessionContext.trim()}
        >
          Generate Draft
        </Button>
        {draft && (
          <Text size="xs" c="dimmed">{draft.length} chars</Text>
        )}
      </Group>

      {error && (
        <Alert color="red" title="Draft failed" radius="md">
          {error}
        </Alert>
      )}

      {draft && (
        <Stack gap="xs">
          <Textarea
            label="Generated Draft"
            value={draft}
            readOnly
            autosize
            minRows={5}
            size="sm"
            styles={{ input: { background: 'var(--mantine-color-gray-0)', fontFamily: 'inherit' } }}
          />
          <Button
            size="xs"
            variant="light"
            color="teal"
            leftSection={<Sparkles size={14} />}
            onClick={() => onDraftAccepted(draft)}
          >
            Use This Draft
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
