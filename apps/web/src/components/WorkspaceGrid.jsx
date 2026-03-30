import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useI18n } from '../lib/i18nContext.jsx';
import ClientModal from './ClientModal';

function formatHours(minutes) {
  const safeMinutes = Number(minutes) || 0;
  const hours = safeMinutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function formatStatusSummary(entries = {}, t) {
  const pairs = Object.entries(entries);
  if (!pairs.length) return t('dashboard.clients.none');
  return pairs
    .map(([status, count]) => `${t(`dashboard.status.${status}`)}: ${count}`)
    .join(' · ');
}

function SummaryMetric({ label, value, help }) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Text c="dimmed" fz="xs" tt="uppercase" fw={700}>{label}</Text>
      <Text fw={700} fz="xl" mt={6}>{value}</Text>
      {help ? <Text c="dimmed" fz="xs" mt={4}>{help}</Text> : null}
    </Paper>
  );
}

export default function WorkspaceGrid({
  operationsSummaryData,
  onClientsUpdated,
  onViewCalendar,
  onNewAppointment,
}) {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const summary = operationsSummaryData?.summary ?? null;
  const loading = operationsSummaryData?.loading ?? false;
  const error = operationsSummaryData?.error ?? null;

  const todaySchedule = summary?.todaySchedule ?? {};
  const priorityQueue = summary?.priorityQueue ?? {};
  const complianceWatch = summary?.complianceWatch ?? {};
  const clientsBox = summary?.clientsBox ?? {};
  const workload = Array.isArray(todaySchedule.workload) ? todaySchedule.workload : [];
  const noteGapClients = complianceWatch?.noteGapClients ?? {};
  const outstandingAssignments = complianceWatch?.outstandingAssignments ?? {};
  const portalRequests = clientsBox?.portalRequests ?? {};

  const renderSummaryState = () => {
    if (loading) {
      return (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      );
    }
    if (error) {
      return <Text c="red" fz="sm">{error}</Text>;
    }
    return null;
  };

  return (
    <Stack gap="md" p="md">
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Title order={3} fz="md">{t('panels.schedule')}</Title>
          <Group gap="xs">
            <Button variant="default" size="xs" onClick={() => onViewCalendar?.()}>{t('buttons.viewCalendar')}</Button>
            <Button size="xs" onClick={() => onNewAppointment?.()}>{t('header.newAppointment')}</Button>
          </Group>
        </Group>

        {renderSummaryState() || (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <SummaryMetric
                label={t('dashboard.schedule.totalAppointments')}
                value={todaySchedule.totalAppointments ?? 0}
              />
              <SummaryMetric
                label={t('dashboard.schedule.counselorsWithEntries')}
                value={todaySchedule.counselorsWithEntries ?? 0}
              />
              <SummaryMetric
                label={t('dashboard.schedule.oneHourGaps')}
                value={todaySchedule.oneHourGapsTotal ?? 0}
                help={t('dashboard.schedule.oneHourGapsHelp')}
              />
            </SimpleGrid>

            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>{t('dashboard.schedule.workload')}</Text>
                <Badge variant="light">{workload.length}</Badge>
              </Group>

              {workload.length === 0 ? (
                <Text c="dimmed" fz="sm">{t('dashboard.schedule.noCounselorWorkload')}</Text>
              ) : workload.map((item) => (
                <Paper key={item.counselorId || item.counselorName} withBorder radius="md" p="sm">
                  <Group justify="space-between" align="flex-start" mb={8}>
                    <div>
                      <Text fw={600} fz="sm">{item.counselorName}</Text>
                      <Text c="dimmed" fz="xs">
                        {item.appointmentsCount} {t('dashboard.schedule.appointments')} · {formatHours(item.scheduledMinutes)} {t('dashboard.schedule.booked')}
                      </Text>
                    </div>
                    <Text fw={700} fz="sm">{Number(item.utilizationPct ?? 0).toFixed(1)}%</Text>
                  </Group>
                  <Progress value={Number(item.utilizationPct ?? 0)} size="lg" radius="xl" />
                  <Group justify="space-between" mt={8}>
                    <Text c="dimmed" fz="xs">
                      {t('dashboard.schedule.availableCapacity')}: {formatHours(item.availableMinutes)}
                    </Text>
                    <Text c="dimmed" fz="xs">
                      {t('dashboard.schedule.gaps')}: {item.oneHourGapCount ?? 0}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}
      </Paper>

      <Group grow align="flex-start" gap="md">
        <Paper withBorder radius="md" p="md" style={{ flex: 1 }}>
          <Title order={3} fz="md" mb="sm">{t('panels.priority')}</Title>
          {renderSummaryState() || (
            <Stack gap="xs">
              <Text c="dimmed" fz="sm">{priorityQueue.description || t('dashboard.priority.description')}</Text>
              <Text fw={700} fz="2rem">{priorityQueue.highTouchpointClients ?? 0}</Text>
              <Text c="dimmed" fz="xs">{t('dashboard.priority.highTouchpointHelp')}</Text>
            </Stack>
          )}
        </Paper>

        <Paper withBorder radius="md" p="md" style={{ flex: 1 }}>
          <Title order={3} fz="md" mb="sm">{t('panels.compliance')}</Title>
          {renderSummaryState() || (
            <Stack gap="sm">
              <SimpleGrid cols={2}>
                <SummaryMetric label={t('dashboard.compliance.oneDay')} value={noteGapClients.over1Day ?? 0} />
                <SummaryMetric label={t('dashboard.compliance.threeDays')} value={noteGapClients.over3Days ?? 0} />
                <SummaryMetric label={t('dashboard.compliance.oneWeek')} value={noteGapClients.over7Days ?? 0} />
                <SummaryMetric
                  label={t('dashboard.compliance.outstandingAssignedWork')}
                  value={outstandingAssignments.total ?? 0}
                  help={`${t('dashboard.compliance.documents')}: ${outstandingAssignments.documents ?? 0} · ${t('dashboard.compliance.forms')}: ${outstandingAssignments.forms ?? 0}`}
                />
              </SimpleGrid>
            </Stack>
          )}
        </Paper>
      </Group>

      <Paper withBorder radius="md" p="md" component="section" aria-labelledby="clientsPanelTitle">
        <Group justify="space-between" mb="sm">
          <Title order={3} fz="md" id="clientsPanelTitle">{t('nav.clients')}</Title>
          <Button size="xs" onClick={() => setModalOpen(true)}>{t('clients.newClient')}</Button>
        </Group>

        {renderSummaryState() || (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <SummaryMetric label={t('dashboard.clients.totalClients')} value={clientsBox.totalClients ?? 0} />
              <SummaryMetric label={t('dashboard.clients.withoutScheduledAppointment')} value={clientsBox.withoutScheduledAppointment ?? 0} />
              <SummaryMetric label={t('dashboard.clients.portalRequests')} value={portalRequests.total ?? 0} />
            </SimpleGrid>

            <Box>
              <Text fw={600} fz="sm" mb={6}>{t('dashboard.clients.publicRegistrationRequests')}</Text>
              <Text c="dimmed" fz="sm">{formatStatusSummary(portalRequests.publicRegistrationStatuses, t)}</Text>
            </Box>

            <Box>
              <Text fw={600} fz="sm" mb={6}>{t('dashboard.clients.portalAppointmentRequests')}</Text>
              <Text c="dimmed" fz="sm">{formatStatusSummary(portalRequests.appointmentRequestStatuses, t)}</Text>
            </Box>
          </Stack>
        )}

        <ClientModal
          isOpen={modalOpen}
          initialClient={null}
          onClose={() => setModalOpen(false)}
          onSubmit={() => {
            setModalOpen(false);
            onClientsUpdated?.();
          }}
        />
      </Paper>
    </Stack>
  );
}
