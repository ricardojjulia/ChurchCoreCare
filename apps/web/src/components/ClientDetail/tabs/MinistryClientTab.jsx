import { useState, useEffect } from 'react';
import {
  Stack, TextInput, Switch, Alert, Divider, Button, Group, Text, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { csrfHeaders } from '../../../lib/csrf.js';
import { usePlanType } from '../../../lib/usePlanType.js';
import { SectionSurface, SurfaceState } from '../../ui/surface.jsx';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const b = await res.json();
      msg = b.error || b.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Ministry-plan-only tab on the ClientDetail page.
 *
 * Shows two sections:
 *   1. Church Directory Reference — church directory ID and source, saved together.
 *   2. Scholarship Status — single Switch, auto-saves on toggle.
 *
 * Both sections are hidden when the tenant is not on the ministry plan.
 *
 * @param {{ client: object, clientId: string }} props
 */
export default function MinistryClientTab({ client, clientId }) {
  const { isMinistry, loading: planLoading } = usePlanType();

  // Church directory fields
  const [churchDirectoryId, setChurchDirectoryId] = useState(
    client?.churchDirectoryId ?? client?.church_directory_id ?? '',
  );
  const [churchDirectorySource, setChurchDirectorySource] = useState(
    client?.churchDirectorySource ?? client?.church_directory_source ?? '',
  );
  const [directorySaving, setDirectorySaving] = useState(false);
  const [directoryDirty, setDirectoryDirty] = useState(false);

  // Scholarship status
  const [scholarshipFlag, setScholarshipFlag] = useState(
    !!(client?.scholarshipFlag ?? client?.scholarship_flag),
  );
  const [scholarshipSaving, setScholarshipSaving] = useState(false);

  // Keep local state in sync if the client prop changes (e.g. parent re-fetches)
  useEffect(() => {
    setChurchDirectoryId(client?.churchDirectoryId ?? client?.church_directory_id ?? '');
    setChurchDirectorySource(client?.churchDirectorySource ?? client?.church_directory_source ?? '');
    setScholarshipFlag(!!(client?.scholarshipFlag ?? client?.scholarship_flag));
    setDirectoryDirty(false);
  }, [client]);

  async function saveDirectoryRef() {
    if (!clientId) return;
    setDirectorySaving(true);
    try {
      await apiFetch(`/api/v1/clients/${clientId}/church-directory-ref`, {
        method: 'PATCH',
        headers: csrfHeaders(),
        body: JSON.stringify({
          churchDirectoryId: churchDirectoryId.trim() || null,
          churchDirectorySource: churchDirectorySource.trim() || null,
        }),
      });
      setDirectoryDirty(false);
      notifications.show({
        title: 'Saved',
        message: 'Church directory reference saved.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setDirectorySaving(false);
    }
  }

  async function handleScholarshipToggle(checked) {
    setScholarshipFlag(checked);
    setScholarshipSaving(true);
    try {
      await apiFetch(`/api/v1/clients/${clientId}/scholarship`, {
        method: 'PATCH',
        headers: csrfHeaders(),
        body: JSON.stringify({ scholarshipFlag: checked }),
      });
      notifications.show({
        title: 'Saved',
        message: 'Scholarship status updated.',
        color: 'green',
      });
    } catch (err) {
      // Revert on failure
      setScholarshipFlag(!checked);
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setScholarshipSaving(false);
    }
  }

  if (planLoading) {
    return <SurfaceState type="loading" message="Loading ministry settings..." />;
  }

  if (!isMinistry) {
    return (
      <SurfaceState
        message="Ministry plan features are not available on this account."
      />
    );
  }

  return (
    <Stack gap="xl" maw={700}>
      {/* Church Directory Reference */}
      <SectionSurface>
        <Title order={4} fz="sm" tt="uppercase" c="dimmed" mb="sm">
          Church Directory Reference
        </Title>
        <Divider mb="sm" />
        <Stack gap="sm">
          <TextInput
            label="Church Directory ID"
            value={churchDirectoryId}
            onChange={(e) => {
              setChurchDirectoryId(e.currentTarget.value);
              setDirectoryDirty(true);
            }}
            placeholder="Member ID in your church directory system"
          />
          <TextInput
            label="Directory Source"
            value={churchDirectorySource}
            onChange={(e) => {
              setChurchDirectorySource(e.currentTarget.value);
              setDirectoryDirty(true);
            }}
            placeholder="e.g. Planning Center, Breeze, Church Community Builder"
          />
          <Group justify="flex-end" mt="xs">
            <Button
              onClick={saveDirectoryRef}
              loading={directorySaving}
              disabled={!directoryDirty}
              size="sm"
            >
              Save Directory Reference
            </Button>
          </Group>
        </Stack>
      </SectionSurface>

      {/* Scholarship Status */}
      <SectionSurface>
        <Title order={4} fz="sm" tt="uppercase" c="dimmed" mb="sm">
          Scholarship Status
        </Title>
        <Divider mb="sm" />
        <Stack gap="sm">
          <Switch
            label="Scholarship Client"
            description="This client receives scholarship support — invoicing disabled"
            checked={scholarshipFlag}
            onChange={(e) => handleScholarshipToggle(e.currentTarget.checked)}
            disabled={scholarshipSaving}
          />
          {scholarshipFlag && (
            <Alert color="yellow" variant="light" fz="sm">
              Invoices cannot be created for scholarship clients
            </Alert>
          )}
          {scholarshipSaving && (
            <Text fz="xs" c="dimmed">Saving scholarship status...</Text>
          )}
        </Stack>
      </SectionSurface>
    </Stack>
  );
}
