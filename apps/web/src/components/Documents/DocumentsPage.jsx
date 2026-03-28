import { useState } from 'react';
import {
  Stack, Title, Text, Paper, Group, Button, SimpleGrid,
  Badge, Alert, Box, Divider,
} from '@mantine/core';

import FormRunner from './FormRunner.jsx';
import { CATEGORIES, FORM_CATALOG } from './formRegistry.js';

// ─── Individual form card ─────────────────────────────────────────────────────
function FormCard({ entry, onSelect }) {
  const { formDef, badgeLabel, badgeColor, crisisAlert } = entry;

  return (
    <Paper
      withBorder
      radius="lg"
      p="xl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderTop: crisisAlert ? '3px solid var(--mantine-color-red-6)' : '3px solid var(--mantine-color-brand-5)',
        background: 'var(--surface)',
        transition: 'box-shadow 0.15s',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text fz="2rem" style={{ lineHeight: 1 }}>{formDef.icon}</Text>
        <Group gap="xs">
          <Badge color={badgeColor} variant="light" size="sm" radius="sm">
            {badgeLabel}
          </Badge>
          <Badge color="gray" variant="outline" size="sm" radius="sm">
            ~{formDef.estimatedMinutes} min
          </Badge>
        </Group>
      </Group>

      <Stack gap={4}>
        <Title order={5} style={{ color: 'var(--text)' }}>{formDef.title}</Title>
        <Text fz="sm" c="dimmed" lineClamp={3}>{formDef.description}</Text>
      </Stack>

      <Stack gap={4}>
        <Text fz="xs" c="dimmed">
          {formDef.sections?.length ?? 0} sections · {countFields(formDef)} fields
        </Text>
        {crisisAlert && (
          <Alert color="red" radius="md" p="xs" fz="xs">
            <Text fz="xs" fw={600}>
              ⚠ Clinical use. In crisis? Call/text <strong>988</strong> or text <strong>HOME to 741741</strong>.
            </Text>
          </Alert>
        )}
      </Stack>

      <Button
        fullWidth
        mt="auto"
        variant={crisisAlert ? 'outline' : 'filled'}
        color={crisisAlert ? 'red' : 'brand'}
        radius="md"
        onClick={() => onSelect(entry)}
      >
        Open Form
      </Button>
    </Paper>
  );
}

function countFields(formDef) {
  return (formDef.sections ?? []).reduce((sum, sec) => sum + sec.fields.length, 0);
}

// ─── Library header ───────────────────────────────────────────────────────────
function LibraryHeader() {
  return (
    <Box>
      <Group gap="xs" mb={4}>
        <Text fz="1.5rem">📄</Text>
        <Title order={3} style={{ color: 'var(--text)' }}>Client Documents</Title>
      </Group>
      <Text fz="sm" c="dimmed" maw={560}>
        Electronic forms for counseling assessments and intake. All forms include a Faith &amp; Spiritual
        Profile section rooted in Christian principles. Complete in-session or assign for self-completion.
      </Text>
      <Divider mt="lg" />
    </Box>
  );
}

// ─── Main DocumentsPage ───────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [activeEntry, setActiveEntry] = useState(null);

  // Show form runner if a form is selected
  if (activeEntry) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <FormRunner formDef={activeEntry.formDef} onClose={() => setActiveEntry(null)} />
      </Box>
    );
  }

  // Show form library
  return (
    <Box
      style={{
        background: 'var(--bg)',
        minHeight: '100%',
        padding: '24px',
      }}
    >
      <Stack gap="xl" maw={1200} mx="auto">
        <LibraryHeader />

        {CATEGORIES.map((cat) => {
          const forms = FORM_CATALOG.filter((e) => e.category === cat.id);
          if (!forms.length) return null;
          return (
            <Stack key={cat.id} gap="sm">
              <Group gap="xs" align="center">
                <Text fz="lg" style={{ lineHeight: 1 }}>{cat.icon}</Text>
                <Title order={4} style={{ color: 'var(--text)' }}>{cat.label}</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {forms.map((entry) => (
                  <FormCard key={entry.formDef.id} entry={entry} onSelect={setActiveEntry} />
                ))}
              </SimpleGrid>
            </Stack>
          );
        })}

        {/* Christian counseling note */}
        <Paper withBorder p="lg" radius="lg" style={{ background: 'var(--mantine-color-brand-0)' }}>
          <Group gap="md" align="flex-start">
            <Text fz="1.5rem">✝️</Text>
            <Stack gap={4}>
              <Text fw={600} fz="sm">Christian Counseling Integration</Text>
              <Text fz="sm" c="dimmed">
                Every form in this library includes a <strong>Faith &amp; Spiritual Profile</strong> or{' '}
                <strong>Faith Dimension</strong> section. These sections invite clients to share their
                spiritual life, how faith shapes their healing, and their openness to prayer and Scripture
                within the counseling relationship.
              </Text>
              <Text fz="xs" c="dimmed" mt={4} fs="italic">
                "He heals the brokenhearted and binds up their wounds." — Psalm 147:3
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Stack>
    </Box>
  );
}
