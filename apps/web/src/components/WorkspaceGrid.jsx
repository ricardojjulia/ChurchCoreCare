import { useState } from 'react';
import { Paper, Group, Title, Button, Text, Stack, Loader, Box,
         UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { csrfHeaders } from '../lib/csrf.js';
import { useI18n } from '../lib/i18nContext.jsx';
import ClientModal from './ClientModal';

export default function WorkspaceGrid({
  clientsData,
  onClientsUpdated,
  onViewClient,
  onViewCalendar,
  onNewAppointment,
  onScheduleClient,
}) {
  const { t } = useI18n();
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const clients       = clientsData?.items   ?? [];
  const clientsLoading = clientsData?.loading ?? false;
  const clientsError  = clientsData?.error   ?? null;

  const handleAddClient  = () => { setEditingClient(null); setModalOpen(true); };
  const handleViewClient = (client) => { if (onViewClient) onViewClient(client.id); };

  const handleDeleteClient = async (client) => {
    if (!confirm(t('clients.deleteConfirm', { name: `${client.firstName} ${client.lastName}` }))) return;
    try {
      const res = await fetch(`/api/v1/clients/${client.id}`, { method: 'DELETE', headers: csrfHeaders() });
      if (res.ok) {
        onClientsUpdated();
        notifications.show({ title: t('state.deleted'), message: t('clients.deletedMessage', { name: `${client.firstName} ${client.lastName}` }), color: 'green' });
      }
    } catch (err) {
      notifications.show({ title: t('state.error'), message: err.message || t('clients.deleteFailed'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" p="md">
      {/* Today's Schedule */}
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Title order={3} fz="md">{t('panels.schedule')}</Title>
          <Group gap="xs">
            <Button variant="default" size="xs" onClick={() => onViewCalendar?.()}>{t('buttons.viewCalendar')}</Button>
            <Button size="xs" onClick={() => onNewAppointment?.()}>{t('header.newAppointment')}</Button>
          </Group>
        </Group>
        <Text c="dimmed" fz="sm" py="sm">{t('scheduling.noneScheduled')}</Text>
      </Paper>

      <Group grow align="flex-start" gap="md">
        {/* Priority Queue */}
        <Paper withBorder radius="md" p="md" style={{ flex: 1 }}>
          <Title order={3} fz="md" mb="sm">{t('panels.priority')}</Title>
          <Text c="dimmed" fz="sm">{t('priority.allCleared')}</Text>
        </Paper>

        {/* Compliance Watch */}
        <Paper withBorder radius="md" p="md" style={{ flex: 1 }}>
          <Title order={3} fz="md" mb="sm">{t('panels.compliance')}</Title>
          <Text c="dimmed" fz="sm">{t('compliance.noIssues')}</Text>
        </Paper>
      </Group>

      {/* Clients */}
      <Paper withBorder radius="md" p="md" component="section" aria-labelledby="clientsPanelTitle">
        <Group justify="space-between" mb="sm">
          <Title order={3} fz="md" id="clientsPanelTitle">{t('nav.clients')}</Title>
          <Button size="xs" onClick={handleAddClient}>{t('clients.newClient')}</Button>
        </Group>

        {clientsLoading ? (
          <Group justify="center" py="xl"><Loader size="sm" /></Group>
        ) : clientsError ? (
          <Text c="red" fz="sm">{clientsError}</Text>
        ) : clients.length === 0 ? (
          <Text c="dimmed" fz="sm">{t('clients.noneAvailable')}</Text>
        ) : (
          <Stack gap={0}>
            {clients.map((client) => (
              <Box
                key={client.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0', borderBottom: '1px solid var(--mantine-color-default-border)' }}
              >
                <UnstyledButton style={{ flex: 1 }} onClick={() => handleViewClient(client)}>
                  <Text fw={500} fz="sm">{client.firstName} {client.lastName}</Text>
                  <Text c="dimmed" fz="xs">
                    {t('clients.statusPrefix')}: {t(`status.${client.status || 'active'}`)} · {t('clients.faithPrefix')}: {client.faithBackground || t('clients.faithUndeclared')}
                  </Text>
                </UnstyledButton>
                <Group gap="xs">
                  <Button size="xs" color="blue" variant="light" onClick={() => onScheduleClient?.(client.id)}>{t('clients.schedule')}</Button>
                  <Button size="xs" variant="default" onClick={() => handleViewClient(client)}>{t('actions.edit')}</Button>
                  <Button size="xs" color="red" variant="light" onClick={() => handleDeleteClient(client)}>{t('actions.delete')}</Button>
                </Group>
              </Box>
            ))}
          </Stack>
        )}

        <ClientModal
          isOpen={modalOpen}
          initialClient={editingClient}
          onClose={() => setModalOpen(false)}
          onSubmit={onClientsUpdated}
        />
      </Paper>
    </Stack>
  );
}
