import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { Stack, Title, SimpleGrid, TextInput, Select, Textarea, Button, Group, Text, Paper } from '@mantine/core';
import { upsertFaithProfile, patchClient } from '../../../lib/clientApi.js';

const INTEGRATION_OPTIONS = [
  { value: 'none',      label: 'None — secular approach preferred' },
  { value: 'open',      label: 'Open — willing to incorporate faith' },
  { value: 'preferred', label: 'Preferred — wants faith-informed counseling' },
  { value: 'required',  label: 'Required — faith integration is essential' },
];

const INTEGRATION_DESC = {
  none:      'Client prefers a secular approach; no faith content.',
  open:      'Client is willing to incorporate faith when relevant.',
  preferred: 'Client wants faith-informed counseling as a standard approach.',
  required:  'Faith integration is essential to the client and must be central.',
};

const DENOMINATION_OPTIONS = ['Evangelical', 'Baptist', 'Catholic', 'Methodist', 'Presbyterian', 'Pentecostal', 'Non-denominational', 'Orthodox', 'Jewish', 'Muslim', 'Hindu', 'Buddhist', 'Other', 'None'].map((d) => ({ value: d, label: d }));

export default function FaithProfileTab({ client, clientId }) {
  const fp = client.faith ?? {};
  const [denomination,          setDenomination]          = useState(fp.denomination          ?? '');
  const [churchName,            setChurchName]            = useState(fp.church_name            ?? '');
  const [pastorName,            setPastorName]            = useState(fp.pastor_name            ?? '');
  const [spiritualDirector,     setSpiritualDirector]     = useState(fp.spiritual_director     ?? '');
  const [faithIntegrationLevel, setFaithIntegrationLevel] = useState(fp.faith_integration_level ?? 'open');
  const [spiritualConcerns,     setSpiritualConcerns]     = useState(fp.spiritual_concerns     ?? '');
  const [religiousRestrictions, setReligiousRestrictions] = useState(fp.religious_restrictions ?? '');
  const [faithStrengths,        setFaithStrengths]        = useState(fp.faith_strengths        ?? '');
  const [faithBackground,       setFaithBackground]       = useState(client.faithBackground    ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertFaithProfile(clientId, {
        denomination:          denomination.trim()         || null,
        church_name:           churchName.trim()           || null,
        pastor_name:           pastorName.trim()           || null,
        spiritual_director:    spiritualDirector.trim()    || null,
        faith_integration_level: faithIntegrationLevel,
        spiritual_concerns:    spiritualConcerns.trim()    || null,
        religious_restrictions:religiousRestrictions.trim() || null,
        faith_strengths:       faithStrengths.trim()       || null,
      });
      await patchClient(clientId, { faithBackground: faithBackground.trim() || 'Undeclared' });
      notifications.show({ title: 'Saved', message: 'Faith profile saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally { setSaving(false); }
  };

  return (
    <Stack gap="lg" maw={800}>
      <Title order={4}>Faith Profile</Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Stack gap={4}>
          <TextInput label="General Faith Label" placeholder="e.g. Evangelical, Catholic, Undeclared" value={faithBackground} onChange={(e) => setFaithBackground(e.target.value)} />
          <Text fz="xs" c="dimmed">Broad label shown on the client list.</Text>
        </Stack>
        <Select label="Denomination" data={[{ value: '', label: '— Select or type —' }, ...DENOMINATION_OPTIONS]} value={denomination} onChange={(v) => setDenomination(v ?? '')} searchable />
        <TextInput label="Church / Congregation Name" value={churchName}        onChange={(e) => setChurchName(e.target.value)} />
        <TextInput label="Pastor / Priest Name"       value={pastorName}        onChange={(e) => setPastorName(e.target.value)} />
        <TextInput label="Spiritual Director Name"    value={spiritualDirector} onChange={(e) => setSpiritualDirector(e.target.value)} />
      </SimpleGrid>

      <Stack gap="xs">
        <Select label="Faith Integration Level" data={INTEGRATION_OPTIONS} value={faithIntegrationLevel} onChange={(v) => setFaithIntegrationLevel(v ?? 'open')} />
        {faithIntegrationLevel && (
          <Paper p="sm" radius="sm" withBorder style={{ borderLeft: '3px solid var(--mantine-color-brand-5)' }}>
            <Text fz="sm">{INTEGRATION_DESC[faithIntegrationLevel]}</Text>
          </Paper>
        )}
      </Stack>

      <Textarea label="Spiritual Concerns"        rows={3} value={spiritualConcerns}     onChange={(e) => setSpiritualConcerns(e.target.value)}     placeholder="What spiritual issues bring the client to counseling?" />
      <Textarea label="Religious Restrictions"    rows={2} value={religiousRestrictions} onChange={(e) => setReligiousRestrictions(e.target.value)} placeholder="Fasting, Sabbath, dietary requirements…" />
      <Textarea label="Spiritual Strengths"       rows={2} value={faithStrengths}        onChange={(e) => setFaithStrengths(e.target.value)}        placeholder="Sources of spiritual support or resilience…" />

      <Group><Button loading={saving} onClick={handleSave}>Save Faith Profile</Button></Group>
    </Stack>
  );
}
