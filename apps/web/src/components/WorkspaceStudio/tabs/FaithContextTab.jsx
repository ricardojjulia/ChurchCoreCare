import { useState, useEffect } from 'react';
import {
  Stack, TextInput, Select, Group, Button, Alert, Divider, Badge,
  Textarea, Text, Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BookOpen } from 'lucide-react';
import { useI18n } from '../../../lib/i18nContext.jsx';
import { csrfHeaders } from '../../../lib/csrf.js';
import { SectionHeader, SectionSurface, SurfaceState } from '../../ui/surface.jsx';
import { isCounselorRole, isAdminRole } from '../../../lib/roles.js';
import { DENOMINATION_OPTIONS, DEFAULT_VOCAB } from '../../FaithWorkflows/engine/denominationVocab.js';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const b = await res.json(); msg = b.error || b.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

const INTEGRATION_LEVEL_OPTIONS = [
  { value: 'none',      label: 'None' },
  { value: 'open',      label: 'Open' },
  { value: 'preferred', label: 'Preferred' },
  { value: 'required',  label: 'Required' },
];

function arrayToCommaSeparated(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join(', ');
}

function commaSeparatedToArray(str) {
  if (!str || !str.trim()) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function initDraftFromPayload(payload) {
  const vp = payload?.vocabularyPreset ?? {};
  return {
    tradition: payload?.tradition ?? 'broadly_christian',
    prayerTerms: arrayToCommaSeparated(vp.prayerTerms),
    scriptureTerms: arrayToCommaSeparated(vp.scriptureTerms),
    communityTerms: arrayToCommaSeparated(vp.communityTerms),
    spiritualLeaderTitle: vp.spiritualLeaderTitle ?? '',
    practiceType: vp.practiceType ?? '',
    defaultIntegrationLevel: payload?.defaultIntegrationLevel ?? 'open',
    contentGuidelines: '',
    contentGuidelinesConfigured: payload?.contentGuidelinesConfigured ?? false,
  };
}

/**
 * Practice Faith Context configuration tab for Workspace Studio.
 *
 * Admin / practice_owner: full edit form with save controls.
 * Counselor / intern: read-only view of the current tradition and vocabulary.
 *
 * @param {{ userRole: string|null }} props
 */
export default function FaithContextTab({ userRole }) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Tracks whether vocabulary fields still reflect the auto-populated default,
  // so a tradition change can safely overwrite them.
  const [vocabFromDefault, setVocabFromDefault] = useState(true);

  const isReadOnly = isCounselorRole(userRole);
  const canEdit = isAdminRole(userRole);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/v1/practice/faith-profile')
      .then((payload) => {
        setDraft(initDraftFromPayload(payload));
        setVocabFromDefault(false); // Existing server data — do not auto-overwrite
        setDirty(false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    // Any manual vocab edit means we should not auto-overwrite on tradition change
    if (['prayerTerms', 'scriptureTerms', 'communityTerms', 'spiritualLeaderTitle', 'practiceType'].includes(field)) {
      setVocabFromDefault(false);
    }
  }

  function handleTraditionChange(value) {
    const tradition = value ?? 'broadly_christian';
    setDraft((prev) => {
      const next = { ...prev, tradition };
      // Auto-populate vocab only if fields still match the default (not manually edited)
      if (vocabFromDefault) {
        const preset = DEFAULT_VOCAB[tradition];
        if (preset) {
          next.prayerTerms = arrayToCommaSeparated(preset.prayerTerms);
          next.scriptureTerms = arrayToCommaSeparated(preset.scriptureTerms);
          next.communityTerms = arrayToCommaSeparated(preset.communityTerms);
          next.spiritualLeaderTitle = preset.spiritualLeaderTitle;
          next.practiceType = preset.practiceType;
        }
      }
      return next;
    });
    setVocabFromDefault(true); // After a tradition change, fields are back from default
    setDirty(true);
  }

  function applyDefaultVocab() {
    if (!draft?.tradition) return;
    const preset = DEFAULT_VOCAB[draft.tradition];
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      prayerTerms: arrayToCommaSeparated(preset.prayerTerms),
      scriptureTerms: arrayToCommaSeparated(preset.scriptureTerms),
      communityTerms: arrayToCommaSeparated(preset.communityTerms),
      spiritualLeaderTitle: preset.spiritualLeaderTitle,
      practiceType: preset.practiceType,
    }));
    setVocabFromDefault(true);
    setDirty(true);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        tradition: draft.tradition,
        vocabularyPreset: {
          prayerTerms: commaSeparatedToArray(draft.prayerTerms),
          scriptureTerms: commaSeparatedToArray(draft.scriptureTerms),
          communityTerms: commaSeparatedToArray(draft.communityTerms),
          spiritualLeaderTitle: draft.spiritualLeaderTitle.trim(),
          practiceType: draft.practiceType.trim(),
        },
        defaultIntegrationLevel: draft.defaultIntegrationLevel,
      };
      // Only send contentGuidelines if the admin typed something
      if (draft.contentGuidelines && draft.contentGuidelines.trim()) {
        body.contentGuidelines = draft.contentGuidelines.trim();
      }
      const payload = await apiFetch('/api/v1/practice/faith-profile', {
        method: 'PUT',
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      // Refresh from server — never round-trip content guidelines back
      setDraft(initDraftFromPayload(payload));
      setVocabFromDefault(false);
      setDirty(false);
      notifications.show({
        title: 'Saved',
        message: 'Practice faith context updated.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message,
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SurfaceState type="loading" message="Loading faith context..." />;
  if (error) return <SurfaceState type="error" title="Unable to load faith context" message={error} />;
  if (!draft) return <SurfaceState message="No faith context configured for this practice." />;

  // ── Read-only view for counselors ────────────────────────────────────────────
  if (isReadOnly) {
    const traditionLabel = DENOMINATION_OPTIONS.find((o) => o.value === draft.tradition)?.label ?? draft.tradition;
    return (
      <Stack gap="md">
        <SectionSurface>
          <SectionHeader
            title="Practice Faith Context"
            description="The faith tradition and vocabulary configured for this practice."
            meta={<Badge leftSection={<BookOpen size={12} />} color="blue" variant="light">Read-only</Badge>}
          />
          <Divider mb="md" />
          <Stack gap="sm">
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Tradition</Text>
              <Text fz="sm">{traditionLabel}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Default Integration Level</Text>
              <Text fz="sm">{draft.defaultIntegrationLevel}</Text>
            </Paper>
            <Divider label="Vocabulary" labelPosition="left" />
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Prayer Terms</Text>
              <Text fz="sm">{draft.prayerTerms || '—'}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Scripture Terms</Text>
              <Text fz="sm">{draft.scriptureTerms || '—'}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Community Terms</Text>
              <Text fz="sm">{draft.communityTerms || '—'}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Spiritual Leader Title</Text>
              <Text fz="sm">{draft.spiritualLeaderTitle || '—'}</Text>
            </Paper>
          </Stack>
        </SectionSurface>
      </Stack>
    );
  }

  // ── Edit form for admins and practice_owner ───────────────────────────────────
  if (!canEdit) {
    return (
      <SurfaceState
        type="error"
        title="Access denied"
        message="You do not have permission to configure the practice faith context."
      />
    );
  }

  return (
    <Stack gap="md">
      <SectionSurface>
        <SectionHeader
          title="Practice Faith Context"
          description="Configure the denomination tradition and vocabulary for this practice. This vocabulary is used in counselor-facing workflow output templates — it does not affect clinical scoring or safety rules."
          meta={<Badge leftSection={<BookOpen size={12} />} color="teal" variant="light">Faith Workflows</Badge>}
        />
        <Divider mb="md" />
        <Stack gap="sm">
          <Select
            label="Denomination / Tradition"
            description="Selecting a tradition auto-populates the vocabulary defaults below. You can edit them afterwards."
            data={DENOMINATION_OPTIONS}
            value={draft.tradition}
            onChange={handleTraditionChange}
            searchable
          />

          <Divider label="Vocabulary Defaults" labelPosition="left" mt="xs" />

          <Alert color="blue" variant="light" fz="xs">
            Vocabulary terms are used for cosmetic substitution in counselor-facing template text only.
            Clinical rules, PHQ-9 scoring, and safety protocols are never affected by these settings.
          </Alert>

          <Group grow>
            <TextInput
              label="Prayer Terms"
              description="Comma-separated. First term is used as the primary substitution."
              placeholder="prayer, intercession"
              value={draft.prayerTerms}
              onChange={(e) => update('prayerTerms', e.currentTarget.value)}
            />
            <TextInput
              label="Scripture Terms"
              description="Comma-separated. First term is used as the primary substitution."
              placeholder="Scripture, the Word"
              value={draft.scriptureTerms}
              onChange={(e) => update('scriptureTerms', e.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Community Terms"
              description="Comma-separated."
              placeholder="congregation, parish"
              value={draft.communityTerms}
              onChange={(e) => update('communityTerms', e.currentTarget.value)}
            />
            <TextInput
              label="Spiritual Leader Title"
              placeholder="Pastor"
              value={draft.spiritualLeaderTitle}
              onChange={(e) => update('spiritualLeaderTitle', e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label="Practice Type"
            description="Internal identifier used by the workflow engine."
            placeholder="evangelical"
            value={draft.practiceType}
            onChange={(e) => update('practiceType', e.currentTarget.value)}
            style={{ maxWidth: 300 }}
          />

          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              onClick={applyDefaultVocab}
            >
              Reset vocabulary to tradition defaults
            </Button>
          </Group>

          <Divider label="Integration Settings" labelPosition="left" mt="xs" />

          <Select
            label="Default Faith Integration Level"
            description="Applied when a client record does not have an explicit integration level set."
            data={INTEGRATION_LEVEL_OPTIONS}
            value={draft.defaultIntegrationLevel}
            onChange={(v) => update('defaultIntegrationLevel', v ?? 'open')}
            style={{ maxWidth: 300 }}
          />

          <Divider label="Content Guidelines" labelPosition="left" mt="xs" />

          <Alert color="yellow" variant="light" fz="xs">
            Content guidelines are encrypted at rest and cannot be retrieved after saving.
            Leave blank to keep the current value.
          </Alert>

          <Textarea
            label={
              draft.contentGuidelinesConfigured
                ? 'Content Guidelines — guidelines are configured, enter new text to replace'
                : 'Content Guidelines'
            }
            description={
              draft.contentGuidelinesConfigured
                ? 'Guidelines are already stored. Leave blank to keep the existing value.'
                : 'Optional guidance for how counselors should apply faith integration in this practice.'
            }
            placeholder="e.g. Our practice uses faith-integrated CBT approaches grounded in Reformed theology..."
            value={draft.contentGuidelines}
            onChange={(e) => update('contentGuidelines', e.currentTarget.value)}
            autosize
            minRows={3}
            maxLength={4000}
          />

          {draft.contentGuidelinesConfigured && !draft.contentGuidelines && (
            <Badge color="green" variant="light" style={{ alignSelf: 'flex-start' }}>
              Content guidelines configured
            </Badge>
          )}

          <Group justify="flex-end" mt="xs">
            {dirty && <Badge color="yellow" variant="light">{t('practice.unsavedChanges')}</Badge>}
            <Button
              onClick={save}
              loading={saving}
              disabled={!dirty || saving}
            >
              Save Faith Context
            </Button>
          </Group>
        </Stack>
      </SectionSurface>
    </Stack>
  );
}
