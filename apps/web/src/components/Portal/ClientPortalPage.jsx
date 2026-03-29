import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  createPortalAppointmentRequestRecord,
  fetchPortalOverview,
  fetchPortalProfile,
  updatePortalProfile,
} from '../../lib/clientApi.js';
import { frontendTelemetry } from '../../lib/frontendTelemetry.js';
import { useSurfaceTelemetry } from '../../lib/useSurfaceTelemetry.js';

const PORTAL_TAB_SURFACES = {
  dashboard: 'portal.dashboard',
  profile: 'portal.profile',
  appointments: 'portal.appointments',
};

const EDUCATION_LEVELS = [
  { value: '', label: 'Not specified' },
  { value: 'high_school', label: 'High school' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelors', label: 'Bachelor degree' },
  { value: 'masters', label: 'Master degree' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const APPOINTMENT_REQUEST_TYPES = [
  { value: 'session', label: 'New session' },
  { value: 'reschedule', label: 'Reschedule an appointment' },
  { value: 'cancel', label: 'Cancel an appointment' },
  { value: 'follow_up', label: 'Request follow-up' },
];

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function requestStatusColor(status) {
  return {
    requested: 'blue',
    approved: 'green',
    declined: 'red',
    scheduled: 'teal',
  }[status] ?? 'gray';
}

function accountStatusColor(status) {
  return {
    active: 'green',
    invited: 'yellow',
    locked: 'red',
  }[status] ?? 'gray';
}

function profileToDraft(profile) {
  return {
    preferredName: profile?.preferredName ?? '',
    contactEmail: profile?.contactEmail ?? '',
    contactPhone: profile?.contactPhone ?? '',
    contactPreferences: {
      preferredContactMethod: profile?.contactPreferences?.preferredContactMethod ?? 'email',
      okToText: Boolean(profile?.contactPreferences?.okToText),
      okToLeaveMessage: profile?.contactPreferences?.okToLeaveMessage !== false,
      enabledChannels: Array.isArray(profile?.contactPreferences?.enabledChannels)
        ? profile.contactPreferences.enabledChannels
        : [],
    },
    profileDetails: {
      demographics: {
        pronouns: profile?.profileDetails?.demographics?.pronouns ?? '',
        maritalStatus: profile?.profileDetails?.demographics?.maritalStatus ?? '',
      },
      education: {
        level: profile?.profileDetails?.education?.level ?? '',
        occupation: profile?.profileDetails?.education?.occupation ?? '',
      },
      affiliationsText: Array.isArray(profile?.profileDetails?.affiliations)
        ? profile.profileDetails.affiliations.join(', ')
        : '',
    },
  };
}

export default function ClientPortalPage({ currentUser, clients = [] }) {
  const userRole = currentUser?.role ?? null;
  const isClientRole = userRole === 'client';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileDraft, setProfileDraft] = useState(profileToDraft(null));
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestDraft, setRequestDraft] = useState({
    requestedType: 'session',
    preferredStartAt: '',
    preferredEndAt: '',
    mode: 'remote',
    notes: '',
  });

  const previewClients = Array.isArray(clients) ? clients : [];
  const effectiveClientId = isClientRole ? null : selectedClientId;
  const activeSurfaceId = PORTAL_TAB_SURFACES[activeTab] ?? 'portal.dashboard';

  useSurfaceTelemetry(activeSurfaceId, {
    surfaceKind: 'tab',
    workflow: 'portal',
  });

  useEffect(() => {
    if (isClientRole) return;
    if (selectedClientId || !previewClients.length) return;
    setSelectedClientId(previewClients[0].id);
  }, [isClientRole, previewClients, selectedClientId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isClientRole && !effectiveClientId) {
        setLoading(false);
        setOverview(null);
        setProfile(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [overviewPayload, profilePayload] = await Promise.all([
          fetchPortalOverview(effectiveClientId),
          fetchPortalProfile(effectiveClientId),
        ]);
        if (cancelled) return;
        setOverview(overviewPayload);
        setProfile(profilePayload?.item ?? null);
        setProfileDraft(profileToDraft(profilePayload?.item));
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Unable to load portal data.');
        frontendTelemetry.trackUiError('portal', 'load_failure', {
          workflow: 'portal',
          statusClass: err.statusClass ?? '5xx',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [effectiveClientId, isClientRole]);

  const contactPreferenceOptions = overview?.settings?.contactPreferenceOptions?.map((value) => ({
    value,
    label: value.replaceAll('_', ' '),
  })) ?? [
    { value: 'email', label: 'email' },
    { value: 'sms', label: 'sms' },
    { value: 'phone', label: 'phone' },
    { value: 'portal_message', label: 'portal message' },
  ];
  const nextAppointment = overview?.upcomingAppointments?.[0] ?? null;
  const pendingForms = overview?.assignedForms?.length ?? 0;
  const pendingDocuments = Array.isArray(overview?.documents)
    ? overview.documents.filter((item) => !['completed', 'signed'].includes(item.status)).length
    : 0;
  const openRequests = Array.isArray(overview?.appointmentRequests)
    ? overview.appointmentRequests.filter((item) => item.status === 'requested').length
    : 0;
  const financialMode = overview?.settings?.financialMode ?? 'billing';

  async function reloadOverview() {
    const [overviewPayload, profilePayload] = await Promise.all([
      fetchPortalOverview(effectiveClientId),
      fetchPortalProfile(effectiveClientId),
    ]);
    setOverview(overviewPayload);
    setProfile(profilePayload?.item ?? null);
    setProfileDraft(profileToDraft(profilePayload?.item));
  }

  async function handleProfileSave() {
    setSavingProfile(true);
    try {
      const payload = {
        ...profileDraft,
        profileDetails: {
          demographics: profileDraft.profileDetails.demographics,
          education: profileDraft.profileDetails.education,
          affiliations: profileDraft.profileDetails.affiliationsText
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        },
      };
      const response = await updatePortalProfile(payload, effectiveClientId);
      setProfile(response.item);
      setProfileDraft(profileToDraft(response.item));
      notifications.show({
        title: 'Profile saved',
        message: 'Your portal profile preferences were updated.',
        color: 'green',
      });
      frontendTelemetry.trackAction('portal.profile', 'save_profile', 'success', {
        workflow: 'portal_profile',
      });
    } catch (err) {
      notifications.show({
        title: 'Save failed',
        message: err.message || 'Unable to save portal profile.',
        color: 'red',
      });
      frontendTelemetry.trackAction('portal.profile', 'save_profile', 'failure', {
        workflow: 'portal_profile',
        statusClass: err.statusClass ?? '4xx',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAppointmentRequestSubmit() {
    if (!requestDraft.preferredStartAt || !requestDraft.preferredEndAt) {
      frontendTelemetry.trackValidationError('portal.appointments', 'portal_appointment_request', {
        action: 'submit_request',
      });
      notifications.show({
        title: 'Missing times',
        message: 'Choose a preferred start and end time before submitting.',
        color: 'yellow',
      });
      return;
    }

    setSubmittingRequest(true);
    try {
      await createPortalAppointmentRequestRecord(requestDraft, effectiveClientId);
      await reloadOverview();
      setRequestDraft({
        requestedType: 'session',
        preferredStartAt: '',
        preferredEndAt: '',
        mode: 'remote',
        notes: '',
      });
      notifications.show({
        title: 'Request sent',
        message: 'Your appointment request was sent to the practice.',
        color: 'green',
      });
      frontendTelemetry.trackAction('portal.appointments', 'submit_request', 'success', {
        workflow: 'portal_appointment_request',
      });
    } catch (err) {
      notifications.show({
        title: 'Request failed',
        message: err.message || 'Unable to submit appointment request.',
        color: 'red',
      });
      frontendTelemetry.trackAction('portal.appointments', 'submit_request', 'failure', {
        workflow: 'portal_appointment_request',
        statusClass: err.statusClass ?? '4xx',
      });
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <Stack p="md" gap="md">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={2}>Client Portal</Title>
          <Text c="dimmed" size="sm">
            {overview?.settings?.practiceName || 'FaithCounseling'} portal overview, profile preferences, and appointment self-service.
          </Text>
        </Box>
        {!isClientRole ? (
          <Select
            label="Preview client"
            placeholder="Select a client"
            value={selectedClientId}
            onChange={setSelectedClientId}
            data={previewClients.map((client) => ({
              value: client.id,
              label: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.id,
            }))}
            searchable
            maw={320}
          />
        ) : null}
      </Group>

      {!isClientRole ? (
        <Alert color="blue" variant="light" title="Staff preview mode">
          This view shows the authenticated client portal using the selected client context.
        </Alert>
      ) : null}

      {loading ? (
        <Paper withBorder radius="md" p="xl">
          <Group justify="center" gap="sm">
            <Loader size="sm" />
            <Text>Loading portal data...</Text>
          </Group>
        </Paper>
      ) : error ? (
        <Alert color="red" title="Failed to load portal">{error}</Alert>
      ) : !isClientRole && !effectiveClientId ? (
        <Alert color="yellow" title="Client required">
          Select a client to preview the authenticated portal experience.
        </Alert>
      ) : (
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'dashboard')}>
          <Tabs.List>
            <Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="dashboard" pt="md">
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <Card withBorder radius="md" p="md">
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Next appointment</Text>
                  <Text fw={700} mt={8}>{nextAppointment ? formatDateTime(nextAppointment.startsAt) : 'None scheduled'}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {nextAppointment ? `${nextAppointment.counselorName || 'Counselor'} • ${nextAppointment.locationName || 'TBD'}` : 'Request one below if needed.'}
                  </Text>
                </Card>
                <Card withBorder radius="md" p="md">
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Pending forms</Text>
                  <Text fw={700} mt={8}>{pendingForms}</Text>
                  <Text size="sm" c="dimmed" mt={4}>Assigned forms waiting for completion.</Text>
                </Card>
                <Card withBorder radius="md" p="md">
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Pending documents</Text>
                  <Text fw={700} mt={8}>{pendingDocuments}</Text>
                  <Text size="sm" c="dimmed" mt={4}>Documents that still need review or signature.</Text>
                </Card>
                <Card withBorder radius="md" p="md">
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    {financialMode === 'offering' ? 'Suggested offering' : 'Outstanding balance'}
                  </Text>
                  <Text fw={700} mt={8}>{formatCurrency(overview?.balances?.outstanding ?? 0)}</Text>
                  <Text size="sm" c="dimmed" mt={4}>{openRequests} open appointment request(s).</Text>
                </Card>
              </SimpleGrid>

              {overview?.assignedCounselor ? (
                <Paper withBorder radius="md" p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Assigned counselor</Text>
                      <Title order={4} mt={6}>
                        {overview.assignedCounselor.firstName} {overview.assignedCounselor.lastName}
                      </Title>
                      <Text size="sm" c="dimmed" mt={4}>
                        {(overview.assignedCounselor.role || 'counselor').replaceAll('_', ' ')}
                      </Text>
                    </Box>
                    {overview.account?.status ? (
                      <Badge color={accountStatusColor(overview.account.status)} variant="light">
                        {overview.account.status}
                      </Badge>
                    ) : null}
                  </Group>
                  {overview.assignedCounselor.bio ? (
                    <Text size="sm" mt="sm">{overview.assignedCounselor.bio}</Text>
                  ) : null}
                </Paper>
              ) : null}

              <SimpleGrid cols={{ base: 1, lg: 2 }}>
                <Paper withBorder radius="md" p="md">
                  <Title order={4}>Upcoming appointments</Title>
                  <Stack gap="sm" mt="md">
                    {overview?.upcomingAppointments?.length ? overview.upcomingAppointments.slice(0, 4).map((appointment) => (
                      <Paper key={appointment.id} withBorder radius="sm" p="sm">
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Text fw={600}>{formatDateTime(appointment.startsAt)}</Text>
                            <Text size="sm" c="dimmed">
                              {appointment.appointmentType?.replaceAll('_', ' ') || 'session'} with {appointment.counselorName || 'Counselor'}
                            </Text>
                          </Box>
                          <Badge variant="light">{appointment.status}</Badge>
                        </Group>
                      </Paper>
                    )) : (
                      <Text c="dimmed" size="sm">No appointments are on the schedule yet.</Text>
                    )}
                  </Stack>
                </Paper>

                <Paper withBorder radius="md" p="md">
                  <Title order={4}>Helpful resources</Title>
                  <Stack gap="sm" mt="md">
                    {overview?.resources?.length ? overview.resources.slice(0, 4).map((resource) => (
                      <Paper key={resource.id} withBorder radius="sm" p="sm">
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Text fw={600}>{resource.title}</Text>
                            <Text size="sm" c="dimmed" mt={4}>{resource.content}</Text>
                          </Box>
                          <Badge variant="light">{resource.resourceType}</Badge>
                        </Group>
                      </Paper>
                    )) : (
                      <Text c="dimmed" size="sm">No portal resources have been published yet.</Text>
                    )}
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="profile" pt="md">
            <Paper withBorder radius="md" p="md">
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                  <TextInput
                    label="Preferred name"
                    value={profileDraft.preferredName}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, preferredName: event.currentTarget.value }))}
                  />
                  <Select
                    label="Preferred contact method"
                    value={profileDraft.contactPreferences.preferredContactMethod}
                    onChange={(value) => setProfileDraft((current) => ({
                      ...current,
                      contactPreferences: {
                        ...current.contactPreferences,
                        preferredContactMethod: value || 'email',
                      },
                    }))}
                    data={contactPreferenceOptions}
                  />
                  <TextInput
                    label="Contact email"
                    type="email"
                    value={profileDraft.contactEmail}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, contactEmail: event.currentTarget.value }))}
                  />
                  <TextInput
                    label="Contact phone"
                    value={profileDraft.contactPhone}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, contactPhone: event.currentTarget.value }))}
                  />
                  <MultiSelect
                    label="Enabled contact channels"
                    data={contactPreferenceOptions}
                    value={profileDraft.contactPreferences.enabledChannels}
                    onChange={(value) => setProfileDraft((current) => ({
                      ...current,
                      contactPreferences: {
                        ...current.contactPreferences,
                        enabledChannels: value,
                      },
                    }))}
                  />
                  <TextInput
                    label="Pronouns"
                    value={profileDraft.profileDetails.demographics.pronouns}
                    onChange={(event) => setProfileDraft((current) => ({
                      ...current,
                      profileDetails: {
                        ...current.profileDetails,
                        demographics: {
                          ...current.profileDetails.demographics,
                          pronouns: event.currentTarget.value,
                        },
                      },
                    }))}
                  />
                  <TextInput
                    label="Marital status"
                    value={profileDraft.profileDetails.demographics.maritalStatus}
                    onChange={(event) => setProfileDraft((current) => ({
                      ...current,
                      profileDetails: {
                        ...current.profileDetails,
                        demographics: {
                          ...current.profileDetails.demographics,
                          maritalStatus: event.currentTarget.value,
                        },
                      },
                    }))}
                  />
                  <Select
                    label="Education level"
                    value={profileDraft.profileDetails.education.level}
                    onChange={(value) => setProfileDraft((current) => ({
                      ...current,
                      profileDetails: {
                        ...current.profileDetails,
                        education: {
                          ...current.profileDetails.education,
                          level: value || '',
                        },
                      },
                    }))}
                    data={EDUCATION_LEVELS}
                  />
                  <TextInput
                    label="Occupation"
                    value={profileDraft.profileDetails.education.occupation}
                    onChange={(event) => setProfileDraft((current) => ({
                      ...current,
                      profileDetails: {
                        ...current.profileDetails,
                        education: {
                          ...current.profileDetails.education,
                          occupation: event.currentTarget.value,
                        },
                      },
                    }))}
                  />
                </SimpleGrid>

                <Textarea
                  label="Affiliations"
                  description="Separate multiple affiliations with commas."
                  minRows={3}
                  value={profileDraft.profileDetails.affiliationsText}
                  onChange={(event) => setProfileDraft((current) => ({
                    ...current,
                    profileDetails: {
                      ...current.profileDetails,
                      affiliationsText: event.currentTarget.value,
                    },
                  }))}
                />

                <Group justify="flex-end">
                  <Button loading={savingProfile} onClick={handleProfileSave}>
                    Save profile
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="appointments" pt="md">
            <SimpleGrid cols={{ base: 1, lg: 2 }}>
              <Paper withBorder radius="md" p="md">
                <Title order={4}>Request a scheduling change</Title>
                <Stack gap="md" mt="md">
                  <Select
                    label="Request type"
                    value={requestDraft.requestedType}
                    onChange={(value) => setRequestDraft((current) => ({ ...current, requestedType: value || 'session' }))}
                    data={APPOINTMENT_REQUEST_TYPES}
                  />
                  <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <TextInput
                      label="Preferred start"
                      type="datetime-local"
                      value={requestDraft.preferredStartAt}
                      onChange={(event) => setRequestDraft((current) => ({ ...current, preferredStartAt: event.currentTarget.value }))}
                    />
                    <TextInput
                      label="Preferred end"
                      type="datetime-local"
                      value={requestDraft.preferredEndAt}
                      onChange={(event) => setRequestDraft((current) => ({ ...current, preferredEndAt: event.currentTarget.value }))}
                    />
                  </SimpleGrid>
                  <Select
                    label="Visit mode"
                    value={requestDraft.mode}
                    onChange={(value) => setRequestDraft((current) => ({ ...current, mode: value || 'remote' }))}
                    data={[
                      { value: 'remote', label: 'Remote' },
                      { value: 'in_person', label: 'In person' },
                    ]}
                  />
                  <Textarea
                    label="Notes"
                    minRows={3}
                    value={requestDraft.notes}
                    onChange={(event) => setRequestDraft((current) => ({ ...current, notes: event.currentTarget.value }))}
                  />
                  <Group justify="flex-end">
                    <Button loading={submittingRequest} onClick={handleAppointmentRequestSubmit}>
                      Submit request
                    </Button>
                  </Group>
                </Stack>
              </Paper>

              <Paper withBorder radius="md" p="md">
                <Title order={4}>Recent requests</Title>
                <Stack gap="sm" mt="md">
                  {overview?.appointmentRequests?.length ? overview.appointmentRequests.map((item) => (
                    <Paper key={item.id} withBorder radius="sm" p="sm">
                      <Group justify="space-between" align="flex-start">
                        <Box>
                          <Text fw={600}>{item.requestedType?.replaceAll('_', ' ') || 'session'}</Text>
                          <Text size="sm" c="dimmed">
                            {formatDateTime(item.preferredStartAt)} to {formatDateTime(item.preferredEndAt)}
                          </Text>
                          {item.notes ? <Text size="sm" mt={6}>{item.notes}</Text> : null}
                        </Box>
                        <Badge color={requestStatusColor(item.status)} variant="light">
                          {item.status}
                        </Badge>
                      </Group>
                    </Paper>
                  )) : (
                    <Text c="dimmed" size="sm">No appointment requests have been submitted yet.</Text>
                  )}
                </Stack>
              </Paper>
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  );
}
