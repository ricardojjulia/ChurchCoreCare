import { useState, useEffect } from 'react';
import {
  Stack, TextInput, Select, Group, Button, Alert, Divider, Badge,
  Textarea, Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Video } from 'lucide-react';
import { useI18n } from '../../../lib/i18nContext.jsx';
import { csrfHeaders } from '../../../lib/csrf.js';
import { SectionHeader, SectionSurface, SurfaceState } from '../../ui/surface.jsx';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const b = await res.json(); msg = b.error || b.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

const TIMEZONE_OPTIONS = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
].map((tz) => ({ value: tz, label: tz.replace('America/', '').replace('Pacific/', '').replaceAll('_', ' ') + ` (${tz})` }));

export default function PracticeTab() {
  const { t } = useI18n();

  const PRACTICE_TYPE_OPTIONS = [
    { value: 'solo', label: t('practice.type.solo') },
    { value: 'group', label: t('practice.type.group') },
    { value: 'multi_location', label: t('practice.type.multi_location') },
  ];

  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Video config state — kept separate so we never accidentally round-trip
  // a stale private key back to the server.
  const [videoDraft, setVideoDraft] = useState(null);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoDirty, setVideoDirty] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/v1/practices')
      .then((payload) => {
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setPractices(items);
        if (items.length) initDraft(items[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function initDraft(practice) {
    setDraft({
      id: practice.id,
      name: practice.name ?? '',
      type: practice.type ?? 'solo',
      timezone: practice.timezone ?? 'America/New_York',
      faithTradition: practice.faithTradition ?? 'Christian',
      contactEmail: practice.contactEmail ?? '',
      contactPhone: practice.contactPhone ?? '',
    });
    setDirty(false);

    // Video config — never pre-populate private key (it is never returned by API).
    setVideoDraft({
      id: practice.id,
      jaasAppId: practice.jaasAppId ?? '',
      jaasApiKeyId: practice.jaasApiKeyId ?? '',
      jaasDomain: practice.jaasDomain ?? '8x8.vc',
      jaasPrivateKeyConfigured: practice.jaasPrivateKeyConfigured ?? false,
      jaasPrivateKeyPem: '', // always blank — write-only
    });
    setVideoDirty(false);
  }

  function updateVideo(field, value) {
    setVideoDraft((prev) => ({ ...prev, [field]: value }));
    setVideoDirty(true);
  }

  async function saveVideoConfig() {
    if (!videoDraft?.id) return;
    setVideoSaving(true);
    try {
      // Build patch payload — only send private key if the admin typed one.
      const body = {
        jaasAppId: videoDraft.jaasAppId || null,
        jaasApiKeyId: videoDraft.jaasApiKeyId || null,
        jaasDomain: videoDraft.jaasDomain || null,
      };
      if (videoDraft.jaasPrivateKeyPem.trim()) {
        body.jaasPrivateKeyPem = videoDraft.jaasPrivateKeyPem.trim();
      }
      const payload = await apiFetch(`/api/v1/practices/${videoDraft.id}/video-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(body),
      });
      // Refresh local practice list so jaasPrivateKeyConfigured flag is current.
      setPractices((prev) => prev.map((p) => p.id === videoDraft.id ? payload.item : p));
      setVideoDraft((prev) => ({
        ...prev,
        jaasPrivateKeyConfigured: payload.item?.jaasPrivateKeyConfigured ?? prev.jaasPrivateKeyConfigured,
        jaasPrivateKeyPem: '', // clear the sensitive field after save
      }));
      setVideoDirty(false);
      notifications.show({ title: t('demographics.notify.saved'), message: t('practice.notify.videoUpdated'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('practice.notify.error'), message: err.message, color: 'red' });
    } finally {
      setVideoSaving(false);
    }
  }

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function save() {
    if (!draft?.id) return;
    setSaving(true);
    try {
      const payload = await apiFetch(`/api/v1/practices/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({
          name: draft.name,
          type: draft.type,
          timezone: draft.timezone,
          faithTradition: draft.faithTradition,
          contactEmail: draft.contactEmail,
          contactPhone: draft.contactPhone,
        }),
      });
      setPractices((prev) => prev.map((p) => p.id === draft.id ? payload.item : p));
      setDirty(false);
      notifications.show({ title: t('demographics.notify.saved'), message: t('practice.notify.profileUpdated'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('practice.notify.error'), message: err.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SurfaceState type="loading" message={t('practice.loading')} />;
  if (error) return <SurfaceState type="error" title={t('practice.loadError')} message={error} />;
  if (!draft) return <SurfaceState message={t('practice.notConfigured')} />;

  return (
    <Stack gap="md">
      <SectionSurface>
        <SectionHeader
          title={t('practice.section.profile.title')}
          description={t('practice.section.profile.description')}
        />
        <Divider mb="md" />
        <Stack gap="sm">
          <TextInput
            label={t('practice.field.name')}
            value={draft.name}
            onChange={(e) => update('name', e.currentTarget.value)}
            required
          />
          <Group grow>
            <Select
              label={t('practice.field.type')}
              data={PRACTICE_TYPE_OPTIONS}
              value={draft.type}
              onChange={(v) => update('type', v ?? 'solo')}
            />
            <Select
              label={t('practice.field.timezone')}
              data={TIMEZONE_OPTIONS}
              value={draft.timezone}
              onChange={(v) => update('timezone', v ?? 'America/New_York')}
              searchable
            />
          </Group>
          <TextInput
            label={t('practice.field.faithTradition')}
            value={draft.faithTradition}
            onChange={(e) => update('faithTradition', e.currentTarget.value)}
            description={t('practice.field.faithTraditionDesc')}
          />
          <Divider label={t('practice.field.contactDivider')} labelPosition="left" />
          <Group grow>
            <TextInput
              label={t('practice.field.contactEmail')}
              type="email"
              value={draft.contactEmail}
              onChange={(e) => update('contactEmail', e.currentTarget.value)}
            />
            <TextInput
              label={t('practice.field.contactPhone')}
              value={draft.contactPhone}
              onChange={(e) => update('contactPhone', e.currentTarget.value)}
            />
          </Group>
          <Group justify="flex-end" mt="xs">
            {dirty && <Badge color="yellow" variant="light">{t('practice.unsavedChanges')}</Badge>}
            <Button onClick={save} loading={saving} disabled={!dirty}>{t('practice.save')}</Button>
          </Group>
        </Stack>
      </SectionSurface>

      {practices.length > 1 && (
        <SectionSurface>
          <SectionHeader title={t('practice.section.allPractices')} />
          <Stack gap="xs">
            {practices.map((p) => (
              <Group key={p.id} justify="space-between" wrap="nowrap">
                <Text fz="sm" fw={draft.id === p.id ? 700 : 400}>{p.name}</Text>
                <Group gap="xs">
                  <Badge size="xs" variant="outline">{p.type?.replaceAll('_', ' ')}</Badge>
                  {draft.id !== p.id && (
                    <Button size="xs" variant="subtle" onClick={() => initDraft(p)}>{t('actions.edit')}</Button>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </SectionSurface>
      )}

      {videoDraft && (
        <SectionSurface>
          <SectionHeader
            title={t('practice.section.video.title')}
            description={t('practice.section.video.description')}
            meta={<Badge leftSection={<Video size={12} />} color="blue" variant="light">{t('practice.video.telehealth')}</Badge>}
          />
          <Divider mb="md" />
          <Stack gap="sm">
            <Alert color="blue" variant="light" fz="xs">
              {t('practice.video.encryptedNotice')}
            </Alert>
            <Group grow>
              <TextInput
                label={t('practice.video.jaasAppId')}
                placeholder={t('practice.video.jaasAppIdPlaceholder')}
                description={t('practice.video.jaasAppIdDesc')}
                value={videoDraft.jaasAppId}
                onChange={(e) => updateVideo('jaasAppId', e.currentTarget.value)}
              />
              <TextInput
                label={t('practice.video.jaasApiKeyId')}
                placeholder={t('practice.video.jaasApiKeyIdPlaceholder')}
                description={t('practice.video.jaasApiKeyIdDesc')}
                value={videoDraft.jaasApiKeyId}
                onChange={(e) => updateVideo('jaasApiKeyId', e.currentTarget.value)}
              />
            </Group>
            <TextInput
              label={t('practice.video.jaasDomain')}
              placeholder={t('practice.video.jaasDomainPlaceholder')}
              description={t('practice.video.jaasDomainDesc')}
              value={videoDraft.jaasDomain}
              onChange={(e) => updateVideo('jaasDomain', e.currentTarget.value)}
              style={{ maxWidth: 300 }}
            />
            <Textarea
              label={
                videoDraft.jaasPrivateKeyConfigured
                  ? t('practice.video.privateKeyLabelConfigured')
                  : t('practice.video.privateKeyLabel')
              }
              placeholder={'-----BEGIN RSA PRIVATE KEY-----\n…\n-----END RSA PRIVATE KEY-----'}
              description={
                videoDraft.jaasPrivateKeyConfigured
                  ? t('practice.video.privateKeyDescConfigured')
                  : t('practice.video.privateKeyDesc')
              }
              value={videoDraft.jaasPrivateKeyPem}
              onChange={(e) => updateVideo('jaasPrivateKeyPem', e.currentTarget.value)}
              autosize
              minRows={4}
              styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
            />
            <Group justify="flex-end" mt="xs">
              {videoDirty && <Badge color="yellow" variant="light">{t('practice.unsavedChanges')}</Badge>}
              {videoDraft.jaasPrivateKeyConfigured && !videoDraft.jaasPrivateKeyPem && (
                <Badge color="green" variant="light">{t('practice.video.privateKeyConfigured')}</Badge>
              )}
              <Button onClick={saveVideoConfig} loading={videoSaving} disabled={!videoDirty}>
                {t('practice.video.save')}
              </Button>
            </Group>
          </Stack>
        </SectionSurface>
      )}
    </Stack>
  );
}
