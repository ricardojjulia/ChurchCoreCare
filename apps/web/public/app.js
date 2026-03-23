const sessionStorageKey = 'faith_session';

const fallbackScheduleItems = [
  { title: 'Initial Intake — Sarah K.', detail: '9:00 AM · Cedar Room · Counselor: Rachel Jordan' },
  { title: 'Progress Session — David M.', detail: '10:30 AM · Remote Session · Counselor: Michael Park' },
  { title: 'Family Session — Olson Family', detail: '1:00 PM · Willow Room · Counselor: Hannah Torres' },
];

const fallbackPriorityItems = [
  { title: 'Review unsigned notes', detail: '9 notes require sign-off before 6:00 PM.' },
  { title: 'Approve intake packets', detail: '6 packets submitted awaiting assignment.' },
];

const fallbackComplianceItems = [
  { title: 'Consent renewals due soon', detail: '11 clients have consents expiring in 14 days.' },
  { title: 'MFA exceptions', detail: '1 staff account has temporary grace period enabled.' },
];

const accessMatrix = {
  platform_admin: ['dashboard'],
  practice_owner: ['dashboard', 'clients', 'scheduling', 'clinical', 'documents', 'billing', 'portal'],
  practice_admin: ['dashboard', 'clients', 'scheduling', 'clinical', 'documents', 'billing', 'portal'],
  counselor: ['dashboard', 'clients', 'scheduling', 'clinical', 'documents', 'portal'],
  intern: ['dashboard', 'clients', 'scheduling', 'clinical'],
  scheduler_biller: ['dashboard', 'clients', 'scheduling', 'billing'],
  client: ['dashboard', 'portal'],
};

const globalSearch = document.getElementById('globalSearch');
const schedulePanel = document.getElementById('schedulePanel');
const authGate = document.getElementById('authGate');
const roleSelect = document.getElementById('roleSelect');
const continueButton = document.getElementById('continueButton');
const logoutButton = document.getElementById('logoutButton');
const userBadge = document.getElementById('userBadge');
const openPaletteButton = document.getElementById('openPaletteButton');
const commandPalette = document.getElementById('commandPalette');
const paletteBackdrop = document.getElementById('paletteBackdrop');
const paletteInput = document.getElementById('paletteInput');
const paletteList = document.getElementById('paletteList');
const clientSelect = document.getElementById('clientSelect');
const clientStatusSelect = document.getElementById('clientStatusSelect');
const updateClientButton = document.getElementById('updateClientButton');
const newClientFirstName = document.getElementById('newClientFirstName');
const newClientLastName = document.getElementById('newClientLastName');
const newClientFaithBackground = document.getElementById('newClientFaithBackground');
const newClientStatusSelect = document.getElementById('newClientStatusSelect');
const createClientButton = document.getElementById('createClientButton');
const appointmentSelect = document.getElementById('appointmentSelect');
const appointmentStatusSelect = document.getElementById('appointmentStatusSelect');
const updateAppointmentButton = document.getElementById('updateAppointmentButton');
const newAppointmentClientSelect = document.getElementById('newAppointmentClientSelect');
const newAppointmentStart = document.getElementById('newAppointmentStart');
const newAppointmentEnd = document.getElementById('newAppointmentEnd');
const newAppointmentCounselor = document.getElementById('newAppointmentCounselor');
const newAppointmentLocation = document.getElementById('newAppointmentLocation');
const newAppointmentRemote = document.getElementById('newAppointmentRemote');
const createAppointmentButton = document.getElementById('createAppointmentButton');
const newAppointmentButton = document.getElementById('newAppointmentButton');
const manageStatus = document.getElementById('manageStatus');

let activeScheduleItems = [...fallbackScheduleItems];
let activeRole = '';
let activeClients = [];
let activeAppointments = [];

renderList('timelineList', activeScheduleItems);
renderList('priorityList', fallbackPriorityItems);
renderList('complianceList', fallbackComplianceItems);

setListLoadingState(true);
hydrateFromApi();
bindUiEvents();

function bindUiEvents() {
  globalSearch?.addEventListener('input', () => {
    const query = globalSearch.value.toLowerCase().trim();
    const filtered = activeScheduleItems.filter((item) => {
      return item.title.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query);
    });

    renderList('timelineList', query ? filtered : activeScheduleItems);
    schedulePanel.dataset.filtered = query ? 'true' : 'false';
  });

  continueButton?.addEventListener('click', () => {
    const role = roleSelect.value;
    if (!role) return;

    localStorage.setItem(sessionStorageKey, JSON.stringify({ role }));
    applySession(role);
  });

  logoutButton?.addEventListener('click', () => {
    localStorage.removeItem(sessionStorageKey);
    activeRole = '';
    applyAccessControl('platform_admin');
    userBadge.textContent = 'Not signed in';
    authGate.classList.add('visible');
    authGate.removeAttribute('hidden');
  });

  openPaletteButton?.addEventListener('click', () => {
    openPalette();
  });

  paletteBackdrop?.addEventListener('click', closePalette);
  paletteInput?.addEventListener('input', renderPalette);

  updateClientButton?.addEventListener('click', updateClientStatus);
  createClientButton?.addEventListener('click', createClient);
  updateAppointmentButton?.addEventListener('click', updateAppointmentStatus);
  createAppointmentButton?.addEventListener('click', createAppointment);
  clientSelect?.addEventListener('change', () => {
    const selectedClient = activeClients.find((item) => item.id === clientSelect.value);
    if (selectedClient && clientStatusSelect) {
      clientStatusSelect.value = selectedClient.status;
    }
  });
  appointmentSelect?.addEventListener('change', () => {
    const selectedAppointment = activeAppointments.find((item) => item.id === appointmentSelect.value);
    if (selectedAppointment && appointmentStatusSelect) {
      appointmentStatusSelect.value = selectedAppointment.status;
    }
  });
  newAppointmentButton?.addEventListener('click', () => {
    document.getElementById('managePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    newAppointmentClientSelect?.focus();
  });

  document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const openCombo = isMac ? event.metaKey && event.key.toLowerCase() === 'k' : event.ctrlKey && event.key.toLowerCase() === 'k';

    if (openCombo) {
      event.preventDefault();
      openPalette();
      return;
    }

    if (event.key === '/' && document.activeElement !== globalSearch && !isTypingElement(document.activeElement)) {
      event.preventDefault();
      globalSearch?.focus();
      return;
    }

    if (event.key === 'Escape' && commandPalette?.classList.contains('visible')) {
      closePalette();
    }
  });
}

async function hydrateFromApi() {
  const connection = document.getElementById('dataConnection');

  try {
    const [healthResponse, metadataResponse, clientsResponse, appointmentsResponse] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/bootstrap-metadata'),
      fetch('/api/v1/clients'),
      fetch('/api/v1/appointments'),
    ]);

    if (!healthResponse.ok || !metadataResponse.ok || !clientsResponse.ok || !appointmentsResponse.ok) {
      throw new Error('Unable to load live dashboard data');
    }

    const health = await healthResponse.json();
    const metadata = await metadataResponse.json();
    const clientsPayload = await clientsResponse.json();
    const appointmentsPayload = await appointmentsResponse.json();

    const clients = clientsPayload.items ?? [];
    const appointments = appointmentsPayload.items ?? [];
    activeClients = clients;
    activeAppointments = appointments;

    connection.textContent = `Live API connected · ${health.service} · ${formatTime(health.timestamp)}`;
    setText('metricSessionsValue', `${appointments.length}`);
    setText('metricSessionsMeta', `${countByStatus(appointments, 'scheduled')} scheduled today`);
    setText('metricRolesValue', `${metadata.roles.length}`);
    setText('metricRolesMeta', 'Loaded from live bootstrap metadata');
    setText('metricApptValue', `${metadata.appointmentStatuses.length}`);
    setText('metricApptMeta', 'Appointment status model is in sync');
    setText('metricAuditValue', 'Synced');
    setText('metricAuditMeta', `Last event · ${formatTime(metadata.bootstrapEvent.occurredAt)}`);

    const scheduleItems = appointments.map((appointment) => {
      const startsAt = formatTime(appointment.startsAt);
      const place = appointment.remoteSession ? 'Remote Session' : appointment.locationName;

      return {
        title: `${appointment.clientName} — ${toTitle(appointment.status)}`,
        detail: `${startsAt} · ${place} · Counselor: ${appointment.counselorName}`,
      };
    });

    const waitlistCount = countByStatus(clients, 'waitlist');
    const activeCount = countByStatus(clients, 'active');
    const dischargedCount = countByStatus(clients, 'discharged');

    const livePriority = [
      {
        title: 'Waitlist follow-ups',
        detail: `${waitlistCount} clients currently in intake waitlist stage.`,
      },
      {
        title: 'Active care plans',
        detail: `${activeCount} active clients need plan review windows this month.`,
      },
      ...fallbackPriorityItems,
    ];

    const liveCompliance = [
      {
        title: 'Discharge documentation checks',
        detail: `${dischargedCount} discharged charts should be retention-reviewed this week.`,
      },
      {
        title: 'Audit heartbeat is current',
        detail: `Latest bootstrap event recorded at ${formatTime(metadata.bootstrapEvent.occurredAt)}.`,
      },
      ...fallbackComplianceItems,
    ];

    activeScheduleItems = scheduleItems.length ? scheduleItems : [...fallbackScheduleItems];
    renderList('timelineList', activeScheduleItems);
    renderList('priorityList', livePriority);
    renderList('complianceList', liveCompliance);
    populateManageControls(clients, appointments);

    buildRoleSelect(metadata.roles);
    const savedSession = readSession();
    if (savedSession?.role) {
      applySession(savedSession.role);
    } else {
      applyAccessControl('platform_admin');
      setSignedInState(false, '');
    }
  } catch {
    connection.textContent = 'API offline · showing lightweight local demo data';
    setText('metricAuditValue', 'Local');
    setText('metricAuditMeta', 'Reconnect API for live sync');
    buildRoleSelect(Object.keys(accessMatrix));
    populateManageControls([], []);
    const savedSession = readSession();
    if (savedSession?.role) {
      applySession(savedSession.role);
    } else {
      applyAccessControl('platform_admin');
      setSignedInState(false, '');
    }
  } finally {
    setListLoadingState(false);
    renderPalette();
  }
}

function renderList(elementId, items) {
  const list = document.getElementById(elementId);
  if (!list) return;

  list.innerHTML = '';
  list.classList.remove('is-loading');
  list.setAttribute('aria-busy', 'false');

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.innerHTML = '<h3>No matching results</h3><p>Try a broader search query.</p>';
    list.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<h3>${item.title}</h3><p>${item.detail}</p>`;
    list.appendChild(li);
  });
}

function setListLoadingState(isLoading) {
  ['timelineList', 'priorityList', 'complianceList'].forEach((id) => {
    const list = document.getElementById(id);
    if (!list) return;

    list.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    list.classList.toggle('is-loading', isLoading);

    if (!isLoading) return;

    list.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.innerHTML = '<h3>Loading...</h3><p>Fetching live dashboard data.</p>';
    list.appendChild(li);
  });
}

function buildRoleSelect(roles) {
  if (!roleSelect) return;

  roleSelect.innerHTML = '';
  const uniqueRoles = [...new Set(roles)];
  uniqueRoles.forEach((role) => {
    const option = document.createElement('option');
    option.value = role;
    option.textContent = prettifyRole(role);
    roleSelect.appendChild(option);
  });
}

function applySession(role) {
  const chosenRole = role || roleSelect?.value || 'platform_admin';
  activeRole = chosenRole;
  applyAccessControl(chosenRole);
  setSignedInState(true, chosenRole);
}

function applyAccessControl(role) {
  const allowed = accessMatrix[role] ?? ['dashboard'];
  document.querySelectorAll('[data-nav-key]').forEach((button) => {
    const navKey = button.getAttribute('data-nav-key');
    const canSee = allowed.includes(navKey);

    button.hidden = !canSee;
    button.setAttribute('aria-hidden', canSee ? 'false' : 'true');
    button.tabIndex = canSee ? 0 : -1;
  });
}

function setSignedInState(isSignedIn, role) {
  if (!authGate) return;

  authGate.classList.toggle('visible', !isSignedIn);
  if (isSignedIn) {
    authGate.setAttribute('hidden', 'hidden');
    userBadge.textContent = `Signed in · ${prettifyRole(role)}`;
  } else {
    authGate.removeAttribute('hidden');
    userBadge.textContent = 'Not signed in';
  }
}

function renderPalette() {
  if (!paletteList) return;

  const query = (paletteInput?.value || '').toLowerCase().trim();
  const commands = [
    {
      id: 'focus-search',
      label: 'Focus search',
      execute: () => globalSearch?.focus(),
    },
    {
      id: 'open-scheduling',
      label: 'Go to scheduling panel',
      execute: () => document.getElementById('schedulePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
    {
      id: 'switch-role',
      label: 'Switch role',
      execute: () => {
        localStorage.removeItem(sessionStorageKey);
        setSignedInState(false, '');
        roleSelect?.focus();
      },
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      execute: () => logoutButton?.click(),
    },
  ];

  const visibleCommands = commands.filter((command) => command.label.toLowerCase().includes(query));
  paletteList.innerHTML = '';

  if (!visibleCommands.length) {
    const li = document.createElement('li');
    li.textContent = 'No matching command';
    paletteList.appendChild(li);
    return;
  }

  visibleCommands.forEach((command) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = command.label;
    button.addEventListener('click', () => {
      command.execute();
      closePalette();
    });
    li.appendChild(button);
    paletteList.appendChild(li);
  });
}

function openPalette() {
  if (!commandPalette) return;
  commandPalette.classList.add('visible');
  commandPalette.setAttribute('aria-hidden', 'false');
  paletteInput?.focus();
}

function closePalette() {
  if (!commandPalette) return;
  commandPalette.classList.remove('visible');
  commandPalette.setAttribute('aria-hidden', 'true');
  openPaletteButton?.focus();
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionStorageKey) ?? '{}');
  } catch {
    return {};
  }
}

function populateManageControls(clients, appointments) {
  populateSelect(clientSelect, clients, (client) => `${client.firstName} ${client.lastName} (${toTitle(client.status)})`, (client) => client.id);
  populateSelect(newAppointmentClientSelect, clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateSelect(
    appointmentSelect,
    appointments,
    (appointment) => `${appointment.clientName} · ${formatTime(appointment.startsAt)} · ${toTitle(appointment.status)}`,
    (appointment) => appointment.id,
  );

  const selectedClient = clients.find((item) => item.id === clientSelect?.value) ?? clients[0];
  if (selectedClient && clientStatusSelect) {
    clientStatusSelect.value = selectedClient.status;
  }

  const selectedAppointment = appointments.find((item) => item.id === appointmentSelect?.value) ?? appointments[0];
  if (selectedAppointment && appointmentStatusSelect) {
    appointmentStatusSelect.value = selectedAppointment.status;
  }
}

function populateSelect(selectElement, items, labelBuilder, valueBuilder) {
  if (!selectElement) return;

  const previous = selectElement.value;
  selectElement.innerHTML = '';

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = valueBuilder(item);
    option.textContent = labelBuilder(item);
    selectElement.appendChild(option);
  });

  if (!items.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No records available';
    selectElement.appendChild(option);
    selectElement.disabled = true;
    return;
  }

  selectElement.disabled = false;
  if (previous && items.some((item) => valueBuilder(item) === previous)) {
    selectElement.value = previous;
  }
}

async function updateClientStatus() {
  const clientId = clientSelect?.value;
  const status = clientStatusSelect?.value;

  if (!clientId || !status) {
    setManageStatus('Select a client and status first.');
    return;
  }

  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}`, {
      method: 'PATCH',
      body: { status },
    });
    setManageStatus('Client updated.');
  });
}

async function createClient() {
  const firstName = (newClientFirstName?.value ?? '').trim();
  const lastName = (newClientLastName?.value ?? '').trim();
  const faithBackground = (newClientFaithBackground?.value ?? '').trim();
  const status = newClientStatusSelect?.value ?? 'active';

  if (!firstName || !lastName) {
    setManageStatus('Enter both first and last name to create a client.');
    return;
  }

  await runMutation(async () => {
    const payload = await postJson('/api/v1/clients', {
      method: 'POST',
      body: {
        firstName,
        lastName,
        faithBackground: faithBackground || 'Undeclared',
        status,
      },
    });

    if (newClientFirstName) newClientFirstName.value = '';
    if (newClientLastName) newClientLastName.value = '';
    if (newClientFaithBackground) newClientFaithBackground.value = '';
    if (newClientStatusSelect) newClientStatusSelect.value = 'active';
    setManageStatus(`Client created: ${payload.item.firstName} ${payload.item.lastName}.`);
  });
}

async function updateAppointmentStatus() {
  const appointmentId = appointmentSelect?.value;
  const status = appointmentStatusSelect?.value;

  if (!appointmentId || !status) {
    setManageStatus('Select an appointment and status first.');
    return;
  }

  await runMutation(async () => {
    await postJson(`/api/v1/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: { status },
    });
    setManageStatus('Appointment updated.');
  });
}

async function createAppointment() {
  const clientId = newAppointmentClientSelect?.value;
  const startsAt = toIsoDate(newAppointmentStart?.value);
  const endsAt = toIsoDate(newAppointmentEnd?.value);
  const counselorName = (newAppointmentCounselor?.value ?? '').trim();
  const locationName = (newAppointmentLocation?.value ?? '').trim();
  const remoteSession = Boolean(newAppointmentRemote?.checked);

  if (!clientId || !startsAt || !endsAt) {
    setManageStatus('Choose a client and valid start/end times.');
    return;
  }

  await runMutation(async () => {
    await postJson('/api/v1/appointments', {
      method: 'POST',
      body: {
        clientId,
        startsAt,
        endsAt,
        counselorName: counselorName || 'Unassigned Counselor',
        locationName: locationName || (remoteSession ? 'Remote Session' : 'Main Office'),
        remoteSession,
        status: 'scheduled',
      },
    });

    if (newAppointmentCounselor) newAppointmentCounselor.value = '';
    if (newAppointmentLocation) newAppointmentLocation.value = '';
    if (newAppointmentRemote) newAppointmentRemote.checked = false;
    setManageStatus('Appointment created.');
  });
}

async function runMutation(action) {
  try {
    setManageStatus('Saving changes...');
    toggleMutationButtons(true);
    await action();
    await hydrateFromApi();
  } catch (error) {
    setManageStatus(error.message || 'Unable to save changes.');
  } finally {
    toggleMutationButtons(false);
  }
}

function toggleMutationButtons(isDisabled) {
  [createClientButton, updateClientButton, updateAppointmentButton, createAppointmentButton].forEach((button) => {
    if (!button) return;
    button.disabled = isDisabled;
  });
}

function setManageStatus(message) {
  if (!manageStatus) return;
  manageStatus.textContent = message;
}

async function postJson(url, options) {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

function toIsoDate(localDateValue) {
  if (!localDateValue) return null;
  const parsed = new Date(localDateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

function prettifyRole(role) {
  return role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toTitle(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown time';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isTypingElement(element) {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || element.isContentEditable;
}
