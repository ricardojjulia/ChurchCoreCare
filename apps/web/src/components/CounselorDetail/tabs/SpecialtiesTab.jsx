import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Stack, Title, SimpleGrid, Checkbox, NumberInput, Textarea, Button, Group, Loader, Text,
} from '@mantine/core';
import { fetchStaffSpecialtyProfile, upsertStaffSpecialtyProfile } from '../../../lib/clientApi.js';

const SPECIALTIES = [
  { key: 'anxiety',               label: 'Anxiety' },
  { key: 'depression',            label: 'Depression' },
  { key: 'trauma',                label: 'Trauma / PTSD' },
  { key: 'grief',                 label: 'Grief & Loss' },
  { key: 'marriage_couples',      label: 'Marriage & Couples' },
  { key: 'family',                label: 'Family Therapy' },
  { key: 'addiction',             label: 'Addiction & Recovery' },
  { key: 'eating_disorders',      label: 'Eating Disorders' },
  { key: 'ocd',                   label: 'OCD' },
  { key: 'adhd',                  label: 'ADHD' },
  { key: 'spiritual_formation',   label: 'Spiritual Formation' },
  { key: 'biblical_counseling',   label: 'Biblical Counseling' },
  { key: 'premarital',            label: 'Premarital Counseling' },
  { key: 'parenting',             label: 'Parenting' },
  { key: 'adolescents',           label: 'Adolescents' },
  { key: 'mens_issues',           label: "Men's Issues" },
  { key: 'womens_issues',         label: "Women's Issues" },
  { key: 'personality_disorders', label: 'Personality Disorders' },
  { key: 'crisis',                label: 'Crisis Intervention' },
];

const MODALITIES = [
  { key: 'cbt',                      label: 'CBT' },
  { key: 'emdr',                     label: 'EMDR' },
  { key: 'dbt',                      label: 'DBT' },
  { key: 'gottman',                  label: 'Gottman Method' },
  { key: 'eft',                      label: 'EFT' },
  { key: 'narrative',                label: 'Narrative Therapy' },
  { key: 'solution_focused',         label: 'Solution-Focused' },
  { key: 'psychodynamic',            label: 'Psychodynamic' },
  { key: 'act',                      label: 'ACT' },
  { key: 'motivational_interviewing',label: 'Motivational Interviewing' },
  { key: 'play_therapy',             label: 'Play Therapy' },
  { key: 'art_therapy',              label: 'Art Therapy' },
  { key: 'mindfulness',              label: 'Mindfulness-Based' },
  { key: 'somatic',                  label: 'Somatic Therapy' },
  { key: 'internal_family_systems',  label: 'Internal Family Systems' },
  { key: 'biblical_integration',     label: 'Biblical Integration' },
];

const AGE_GROUPS = [
  { key: 'children_0_5',  label: 'Children (0–5)' },
  { key: 'children_6_12', label: 'Children (6–12)' },
  { key: 'adolescents',   label: 'Adolescents (13–17)' },
  { key: 'young_adults',  label: 'Young Adults (18–25)' },
  { key: 'adults',        label: 'Adults (26–64)' },
  { key: 'older_adults',  label: 'Older Adults (65+)' },
  { key: 'couples',       label: 'Couples' },
  { key: 'families',      label: 'Families' },
  { key: 'groups',        label: 'Groups' },
];

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Spanish' },
  { key: 'fr', label: 'French' },
  { key: 'pt', label: 'Portuguese' },
  { key: 'de', label: 'German' },
  { key: 'zh', label: 'Mandarin/Chinese' },
  { key: 'ko', label: 'Korean' },
  { key: 'tl', label: 'Tagalog' },
  { key: 'ar', label: 'Arabic' },
  { key: 'ru', label: 'Russian' },
];

function CheckGroup({ items, selected, onChange, disabled }) {
  const set = new Set(selected);
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
      {items.map(({ key, label }) => (
        <Checkbox
          key={key}
          label={label}
          disabled={disabled}
          checked={set.has(key)}
          onChange={() => {
            if (disabled) return;
            const next = new Set(set);
            if (next.has(key)) next.delete(key); else next.add(key);
            onChange([...next]);
          }}
        />
      ))}
    </SimpleGrid>
  );
}

export default function SpecialtiesTab({ staffId, currentUser }) {
  const isAdmin = ['platform_admin', 'practice_owner', 'practice_admin'].includes(currentUser?.role);
  const isSelf  = currentUser?.staffMemberId === staffId || currentUser?.staffId === staffId;
  const canEdit = isAdmin || isSelf;

  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [specialties,     setSpecialties]     = useState([]);
  const [modalities,      setModalities]      = useState([]);
  const [ageGroupsServed, setAgeGroupsServed] = useState([]);
  const [languages,       setLanguages]       = useState([]);
  const [maxCaseload,     setMaxCaseload]     = useState(null);
  const [notes,           setNotes]           = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStaffSpecialtyProfile(staffId)
      .then((data) => {
        if (cancelled) return;
        const p = data.item ?? {};
        setSpecialties(p.specialties ?? []);
        setModalities(p.modalities ?? []);
        setAgeGroupsServed(p.ageGroupsServed ?? []);
        setLanguages(p.languages ?? []);
        setMaxCaseload(p.maxCaseload ?? null);
        setNotes(p.notes ?? '');
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          notifications.show({ title: 'Error', message: err.message, color: 'red' });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [staffId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertStaffSpecialtyProfile(staffId, {
        specialties, modalities, ageGroupsServed, languages,
        maxCaseload: maxCaseload != null ? Number(maxCaseload) : null,
        notes: notes || null,
      });
      notifications.show({ title: 'Saved', message: 'Specialties saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Group justify="center" py="xl"><Loader size="sm" /></Group>;

  return (
    <Stack gap="lg" maw={900}>
      <form onSubmit={handleSave}>
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Clinical Specialties</Title>
            <CheckGroup items={SPECIALTIES} selected={specialties} onChange={setSpecialties} disabled={!canEdit} />
          </Stack>

          <Stack gap="xs">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Therapeutic Modalities</Title>
            <CheckGroup items={MODALITIES} selected={modalities} onChange={setModalities} disabled={!canEdit} />
          </Stack>

          <Stack gap="xs">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Age Groups Served</Title>
            <CheckGroup items={AGE_GROUPS} selected={ageGroupsServed} onChange={setAgeGroupsServed} disabled={!canEdit} />
          </Stack>

          <Stack gap="xs">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Languages Spoken</Title>
            <CheckGroup items={LANGUAGES} selected={languages} onChange={setLanguages} disabled={!canEdit} />
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <NumberInput
              label="Max Caseload"
              placeholder="e.g. 25"
              min={0}
              disabled={!canEdit}
              value={maxCaseload ?? ''}
              onChange={(val) => setMaxCaseload(val === '' ? null : val)}
            />
            <Textarea
              label="Additional Notes"
              rows={3}
              disabled={!canEdit}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </SimpleGrid>

          {canEdit && (
            <Group>
              <Button type="submit" loading={saving}>Save Specialties</Button>
            </Group>
          )}
        </Stack>
      </form>
    </Stack>
  );
}
