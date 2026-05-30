import { useState, useEffect } from 'react';
import {
  Stack, SimpleGrid, Text, Alert, Divider, Badge,
} from '@mantine/core';
import { Church } from 'lucide-react';
import { useI18n } from '../../../lib/i18nContext.jsx';
import { isAdminRole } from '../../../lib/roles.js';
import { SectionHeader, SectionSurface, SurfaceState, SurfaceStatCard } from '../../ui/surface.jsx';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = new Error(`Request failed: ${res.status}`);
    error.status = res.status;
    try {
      const b = await res.json();
      error.message = b.error || b.message || error.message;
      error.code = b.error;
    } catch (_) {}
    throw error;
  }
  return res.json();
}

/**
 * Ministry Overview tab — Workspace Studio.
 *
 * Visible only to admin/owner roles.
 * Fetches GET /api/v1/ministry/summary on mount.
 * Shows a 403 with ministry_plan_required → upgrade prompt.
 *
 * @param {{ userRole: string|null }} props
 */
export default function MinistryTab({ userRole }) {
  const { t } = useI18n();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planRequired, setPlanRequired] = useState(false);
  const [error, setError] = useState('');

  const canView = isAdminRole(userRole);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch('/api/v1/ministry/summary')
      .then((data) => {
        setSummary(data);
      })
      .catch((err) => {
        if (err.status === 403 && err.code === 'ministry_plan_required') {
          setPlanRequired(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [canView]);

  if (!canView) {
    return (
      <SurfaceState
        type="error"
        title="Access denied"
        message="Admin or practice owner access is required to view the Ministry Overview."
      />
    );
  }

  if (loading) return <SurfaceState type="loading" message={t('ministry.summary.loading')} />;

  if (error) {
    return <SurfaceState type="error" title={t('ministry.summary.error')} message={error} />;
  }

  if (planRequired) {
    return (
      <Stack gap="md">
        <SectionSurface>
          <SectionHeader
            title={t('ministry.summary.planRequired')}
            meta={<Badge leftSection={<Church size={12} />} color="violet" variant="light">Ministry</Badge>}
          />
          <Divider mb="md" />
          <Alert color="violet" variant="light">
            {t('ministry.summary.planRequiredBody')}
          </Alert>
        </SectionSurface>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <SectionSurface>
        <SectionHeader
          title={t('ministry.summary.title')}
          meta={<Badge leftSection={<Church size={12} />} color="violet" variant="light">Ministry</Badge>}
        />
        <Divider mb="md" />
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <SurfaceStatCard
            label={t('ministry.summary.totalClients')}
            value={summary?.totalClients ?? 0}
            color="blue"
          />
          <SurfaceStatCard
            label={t('ministry.summary.scholarshipClients')}
            value={summary?.scholarshipClients ?? 0}
            color="teal"
          />
          <SurfaceStatCard
            label={t('ministry.summary.totalCounselors')}
            value={summary?.totalCounselors ?? 0}
            color="indigo"
          />
        </SimpleGrid>
        <Text fz="xs" c="dimmed" mt="md" ta="center">
          {t('ministry.summary.scholarshipNote')}
        </Text>
      </SectionSurface>
    </Stack>
  );
}
