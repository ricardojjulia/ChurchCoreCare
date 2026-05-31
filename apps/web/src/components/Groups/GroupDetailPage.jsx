import { useEffect, useState } from 'react';
import {
  Stack, Paper, Title, Text, Group, Button, Badge, Alert, Loader,
  ActionIcon, Tabs, TextInput, Modal, NumberInput, Select,
} from '@mantine/core';
import { ArrowLeft, Plus, Calendar, Users, FileText, DollarSign } from 'lucide-react';
import { csrfHeaders } from '../../lib/csrf.js';
import GroupSessionNotesForm from '../ClinicalChart/GroupSessionNotesForm.jsx';
import { useI18n } from '../../lib/i18nContext.jsx';

function MemberBadge({ member, onRemove }) {
  return (
    <Badge variant="outline" size="md" rightSection={
      <ActionIcon size="xs" variant="transparent" onClick={() => onRemove(member.clientId)}>×</ActionIcon>
    }>
      {member.clientId}
    </Badge>
  );
}

function SessionRow({ session, onCancel, onViewNotes, onSubmitBilling }) {
  const { formatDate } = useI18n();
  const isPast = new Date(session.scheduledAt) < new Date();
  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Stack gap={2}>
          <Text fz="sm" fw={600} c={isPast ? 'dimmed' : undefined}>
            {formatDate(new Date(session.scheduledAt), 'datetime')}
          </Text>
          <Text fz="xs" c="dimmed">{session.durationMinutes} min · {session.status}</Text>
        </Stack>
        <Group gap="xs">
          <Button size="xs" variant="default" leftSection={<FileText size={12} />} onClick={() => onViewNotes(session)}>
            Notes
          </Button>
          {session.status !== 'cancelled' && !isPast && (
            <Button size="xs" color="red" variant="light" onClick={() => onCancel(session.id)}>
              Cancel
            </Button>
          )}
          {isPast && session.status !== 'cancelled' && (
            <Button size="xs" variant="light" leftSection={<DollarSign size={12} />} onClick={() => onSubmitBilling(session.id)}>
              Bill
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
}

export default function GroupDetailPage({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [rrule, setRrule] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteSession, setNoteSession] = useState(null);

  async function loadGroup() {
    setLoading(true);
    setError(null);
    try {
      const [gRes, sRes] = await Promise.all([
        fetch(`/api/v1/groups/${groupId}`, { credentials: 'include' }),
        fetch(`/api/v1/groups/${groupId}/sessions`, { credentials: 'include' }),
      ]);
      if (!gRes.ok) throw new Error(`HTTP ${gRes.status}`);
      const gJson = await gRes.json();
      setGroup(gJson.item);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setSessions(sJson.items ?? []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGroup(); }, [groupId]);

  async function addMember() {
    if (!newClientId.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/groups/${groupId}/members`, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify({ clientId: newClientId.trim() }),
        credentials: 'include',
      });
      setAddMemberOpen(false);
      setNewClientId('');
      await loadGroup();
    } finally { setSaving(false); }
  }

  async function removeMember(clientId) {
    await fetch(`/api/v1/groups/${groupId}/members/${encodeURIComponent(clientId)}`, {
      method: 'DELETE', headers: csrfHeaders(), credentials: 'include',
    });
    await loadGroup();
  }

  async function scheduleSession() {
    if (!scheduledAt) return;
    setSaving(true);
    try {
      const body = { scheduledAt, durationMinutes: duration };
      if (rrule.trim()) body.rrule = rrule.trim();
      await fetch(`/api/v1/groups/${groupId}/sessions`, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });
      setScheduleOpen(false);
      setScheduledAt('');
      setRrule('');
      await loadGroup();
    } finally { setSaving(false); }
  }

  async function cancelSession(sessionId) {
    await fetch(`/api/v1/groups/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: csrfHeaders(),
      body: JSON.stringify({ status: 'cancelled' }),
      credentials: 'include',
    });
    await loadGroup();
  }

  async function submitBilling(sessionId) {
    const res = await fetch(`/api/v1/groups/sessions/${sessionId}/billing/submit`, {
      method: 'POST', headers: csrfHeaders(), credentials: 'include',
    });
    const json = await res.json().catch(() => ({}));
    if (json.alreadySubmitted) {
      alert('Claims already submitted for this session.');
    } else if (res.ok) {
      alert(`${json.claimIds?.length ?? 0} claim(s) created.`);
    } else {
      alert(json.error ?? 'Billing failed');
    }
  }

  if (loading) return <Loader size="sm" m="xl" />;
  if (error) return <Alert color="red" m="md">{error}</Alert>;
  if (!group) return null;

  return (
    <Stack p="md" gap="md">
      <Group>
        <ActionIcon variant="default" onClick={onBack}><ArrowLeft size={16} /></ActionIcon>
        <Title order={3}>{group.name}</Title>
        <Badge color={group.isActive ? 'teal' : 'gray'} variant="light">{group.isActive ? 'Active' : 'Inactive'}</Badge>
      </Group>

      <Tabs defaultValue="sessions">
        <Tabs.List>
          <Tabs.Tab value="sessions" leftSection={<Calendar size={14} />}>Sessions</Tabs.Tab>
          <Tabs.Tab value="members" leftSection={<Users size={14} />}>Members</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sessions" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="xs" leftSection={<Plus size={13} />} onClick={() => setScheduleOpen(true)}>
                Schedule Session
              </Button>
            </Group>
            {sessions.length === 0 ? (
              <Text c="dimmed" fz="sm" ta="center" py="xl">No sessions scheduled.</Text>
            ) : (
              sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onCancel={cancelSession}
                  onViewNotes={setNoteSession}
                  onSubmitBilling={submitBilling}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="members" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="xs" leftSection={<Plus size={13} />} onClick={() => setAddMemberOpen(true)}>
                Add Member
              </Button>
            </Group>
            {(group.members ?? []).filter((m) => !m.leftAt).length === 0 ? (
              <Text c="dimmed" fz="sm" ta="center" py="xl">No active members.</Text>
            ) : (
              <Group gap="xs" wrap="wrap">
                {(group.members ?? []).filter((m) => !m.leftAt).map((m) => (
                  <MemberBadge key={m.id} member={m} onRemove={removeMember} />
                ))}
              </Group>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member" centered>
        <Stack gap="md">
          <TextInput label="Client ID" value={newClientId} onChange={(e) => setNewClientId(e.currentTarget.value)} data-autofocus />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={addMember} loading={saving}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Session" centered>
        <Stack gap="md">
          <TextInput
            label="First session date/time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.currentTarget.value)}
            data-autofocus
          />
          <NumberInput label="Duration (minutes)" value={duration} onChange={setDuration} min={15} max={240} step={15} />
          <TextInput
            label="Recurrence rule (optional)"
            description="e.g. FREQ=WEEKLY;BYDAY=TU;COUNT=12"
            value={rrule}
            onChange={(e) => setRrule(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={scheduleSession} loading={saving}>Schedule</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={Boolean(noteSession)}
        onClose={() => setNoteSession(null)}
        title="Session Notes"
        size="lg"
        centered
      >
        {noteSession && (
          <GroupSessionNotesForm
            sessionId={noteSession.id}
            members={(group.members ?? []).filter((m) => !m.leftAt)}
            onSaved={() => setNoteSession(null)}
          />
        )}
      </Modal>
    </Stack>
  );
}
