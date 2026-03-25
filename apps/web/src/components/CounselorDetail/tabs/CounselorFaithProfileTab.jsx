import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Stack, Title, Select, Textarea, Checkbox, TextInput, Button, Group,
  SimpleGrid, Loader,
} from '@mantine/core';
import { fetchStaffFaithProfile, upsertStaffFaithProfile } from '../../../lib/clientApi.js';

const FAITH_TRADITION_OPTIONS = [
  { value: '',                   label: '— select —' },
  { value: 'non_denominational', label: 'Non-Denominational' },
  { value: 'baptist',            label: 'Baptist' },
  { value: 'reformed',           label: 'Reformed / Presbyterian' },
  { value: 'methodist',          label: 'Methodist' },
  { value: 'lutheran',           label: 'Lutheran' },
  { value: 'catholic',           label: 'Catholic' },
  { value: 'pentecostal',        label: 'Pentecostal / Charismatic' },
  { value: 'evangelical',        label: 'Evangelical' },
  { value: 'other',              label: 'Other' },
];

const INTEGRATION_OPTIONS = [
  { value: '',              label: '— select —' },
  { value: 'always_offered',label: 'Always Offered' },
  { value: 'on_request',    label: 'On Request' },
  { value: 'not_offered',   label: 'Not Offered' },
];

const EMPTY = {
  faithTradition: '', theologicalApproach: '', ordained: false, ordainingBody: '',
  aaccMember: false, acbcCertified: false, cccaMember: false,
  otherFaithCredentials: '', prayerIntegration: '', scriptureIntegration: '', spiritualGifts: '',
};

export default function CounselorFaithProfileTab({ staffId, currentUser }) {
  const isAdmin = ['platform_admin', 'practice_owner', 'practice_admin'].includes(currentUser?.role);
  const isSelf  = currentUser?.staffMemberId === staffId || currentUser?.staffId === staffId;
  const canEdit = isAdmin || isSelf;

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStaffFaithProfile(staffId)
      .then((data) => {
        if (cancelled) return;
        const p = data.item ?? {};
        setForm({
          faithTradition:        p.faithTradition        ?? '',
          theologicalApproach:   p.theologicalApproach   ?? '',
          ordained:              Boolean(p.ordained),
          ordainingBody:         p.ordainingBody         ?? '',
          aaccMember:            Boolean(p.aaccMember),
          acbcCertified:         Boolean(p.acbcCertified),
          cccaMember:            Boolean(p.cccaMember),
          otherFaithCredentials: p.otherFaithCredentials ?? '',
          prayerIntegration:     p.prayerIntegration     ?? '',
          scriptureIntegration:  p.scriptureIntegration  ?? '',
          spiritualGifts:        p.spiritualGifts        ?? '',
        });
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

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertStaffFaithProfile(staffId, {
        ...form,
        faithTradition:        form.faithTradition        || null,
        theologicalApproach:   form.theologicalApproach   || null,
        ordainingBody:         form.ordainingBody         || null,
        otherFaithCredentials: form.otherFaithCredentials || null,
        prayerIntegration:     form.prayerIntegration     || null,
        scriptureIntegration:  form.scriptureIntegration  || null,
        spiritualGifts:        form.spiritualGifts        || null,
      });
      notifications.show({ title: 'Saved', message: 'Faith profile saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Group justify="center" py="xl"><Loader size="sm" /></Group>;

  return (
    <Stack gap="lg" maw={800}>
      <form onSubmit={handleSave}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Faith Background</Title>
            <Select
              label="Faith Tradition"
              data={FAITH_TRADITION_OPTIONS}
              disabled={!canEdit}
              value={form.faithTradition}
              onChange={(v) => set('faithTradition', v ?? '')}
            />
            <Textarea
              label="Theological Approach to Counseling"
              rows={4}
              disabled={!canEdit}
              placeholder="Personal statement on how faith is integrated into counseling practice…"
              value={form.theologicalApproach}
              onChange={(e) => set('theologicalApproach', e.target.value)}
            />
          </Stack>

          <Stack gap="sm">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Ordination & Ministry</Title>
            <Checkbox
              label="Ordained Minister / Clergy"
              disabled={!canEdit}
              checked={form.ordained}
              onChange={(e) => set('ordained', e.currentTarget.checked)}
            />
            {form.ordained && (
              <TextInput
                label="Ordaining Body / Denomination"
                disabled={!canEdit}
                value={form.ordainingBody}
                onChange={(e) => set('ordainingBody', e.target.value)}
                maw={400}
              />
            )}
          </Stack>

          <Stack gap="sm">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Professional Faith Memberships</Title>
            <Checkbox label="AACC Member (American Association of Christian Counselors)"   disabled={!canEdit} checked={form.aaccMember}    onChange={(e) => set('aaccMember',    e.currentTarget.checked)} />
            <Checkbox label="ACBC Certified (Association of Certified Biblical Counselors)" disabled={!canEdit} checked={form.acbcCertified} onChange={(e) => set('acbcCertified', e.currentTarget.checked)} />
            <Checkbox label="CCCA Member (Christian Camp and Conference Association)"       disabled={!canEdit} checked={form.cccaMember}    onChange={(e) => set('cccaMember',    e.currentTarget.checked)} />
            <Textarea
              label="Other Faith Credentials / Memberships"
              rows={3}
              disabled={!canEdit}
              placeholder="e.g., Certified Christian Life Coach, Nouthetic Counseling training…"
              value={form.otherFaithCredentials}
              onChange={(e) => set('otherFaithCredentials', e.target.value)}
            />
          </Stack>

          <Stack gap="sm">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">Faith Integration Preferences</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Prayer Integration"
                data={INTEGRATION_OPTIONS}
                disabled={!canEdit}
                value={form.prayerIntegration}
                onChange={(v) => set('prayerIntegration', v ?? '')}
              />
              <Select
                label="Scripture Integration"
                data={INTEGRATION_OPTIONS}
                disabled={!canEdit}
                value={form.scriptureIntegration}
                onChange={(v) => set('scriptureIntegration', v ?? '')}
              />
            </SimpleGrid>
            <Textarea
              label="Spiritual Gifts & Strengths"
              rows={3}
              disabled={!canEdit}
              placeholder="Spiritual gifts, strengths, or areas of particular calling…"
              value={form.spiritualGifts}
              onChange={(e) => set('spiritualGifts', e.target.value)}
            />
          </Stack>

          {canEdit && (
            <Group>
              <Button type="submit" loading={saving}>Save Faith Profile</Button>
            </Group>
          )}
        </Stack>
      </form>
    </Stack>
  );
}
