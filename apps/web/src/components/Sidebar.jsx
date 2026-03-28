import { NavLink, Stack, Text, Group, Button, Box, Divider, Badge } from '@mantine/core';

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard' },
  { key: 'users',       label: 'User Maintenance' },
  { key: 'counselors',  label: 'Counselors' },
  { key: 'clients',     label: 'Clients' },
  { key: 'scheduling',  label: 'Scheduling' },
  { key: 'clinical',    label: 'Clinical Chart' },
  { key: 'documents',   label: 'Documents' },
  { key: 'billing',     label: 'Billing' },
  { key: 'portal',            label: 'Portal' },
  { key: 'workspace-studio', label: 'Workspace Studio' },
  { key: 'operations',       label: 'Operations Studio', href: '/operations.html' },
  { key: 'faith',       label: 'Faith Workflows' },
  { key: 'about',       label: 'About', href: '/about.html' },
  { key: 'monitor',     label: 'Monitoring', href: '/monitor.html' },
];

function canViewNavItem(item, role) {
  if (item.key === 'users' || item.key === 'counselors') {
    return ['platform_admin', 'practice_owner', 'practice_admin'].includes(role || '');
  }
  return true;
}

function resolveUserLabel(user, role) {
  if (typeof user?.name === 'string' && user.name.trim()) {
    return role ? `${user.name.trim()} • ${role}` : user.name.trim();
  }
  if (typeof user?.email === 'string' && user.email.trim()) {
    return role ? `${user.email.trim()} • ${role}` : user.email.trim();
  }
  return role ? `Signed in as ${role}` : 'Not signed in';
}

const CONNECTION_TONE = {
  loading: { color: 'gray', label: 'Connecting…' },
  connected: { color: 'green', label: 'API Connected' },
  error: { color: 'red', label: 'Connection Error' },
};

export default function Sidebar({ currentUser, currentView, onNavigate, onOpenClientPicker, onSignOut, connectionStatus }) {
  const userRole = currentUser?.role ?? null;
  const visibleNavItems = NAV_ITEMS.filter((item) => canViewNavItem(item, userRole));
  const connectionTone = CONNECTION_TONE[connectionStatus] ?? CONNECTION_TONE.loading;

  return (
    <Stack h="100%" gap={0} p="sm">
      <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 8 }}>
        <Group gap="sm" mb="md" px="xs" className="sidebar-options-head">
          <Box className="sidebar-options-mark" aria-hidden="true">
            <span className="sidebar-options-glow"></span>
            <span className="sidebar-options-person sidebar-options-person--left"></span>
            <span className="sidebar-options-person sidebar-options-person--right"></span>
            <span className="sidebar-options-wave"></span>
          </Box>
          <Box>
            <Text fw={800} fz="sm" lh={1.1}>Options</Text>
          </Box>
        </Group>

        <Text
          id="userBadge"
          fz="xs"
          c="dimmed"
          px="xs"
          mb={6}
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 999,
            padding: '6px 12px',
            display: 'inline-block',
          }}
        >
          {resolveUserLabel(currentUser, userRole)}
        </Text>

        <Box px="xs" mb="sm">
          <Badge
            color={connectionTone.color}
            variant="light"
            radius="xl"
            size="md"
          >
            {connectionTone.label}
          </Badge>
        </Box>

        <Stack gap={2} component="nav" aria-label="Primary">
          {visibleNavItems.map((item) =>
            item.href ? (
              <NavLink
                key={item.key}
                data-nav-key={item.key}
                component="a"
                href={item.href}
                label={item.label}
                styles={{ root: { borderRadius: 8 } }}
              />
            ) : (
              <NavLink
                key={item.key}
                data-nav-key={item.key}
                label={item.label}
                active={currentView === item.key}
                onClick={() => onNavigate?.(item.key)}
                styles={{ root: { borderRadius: 8 } }}
              />
            )
          )}
        </Stack>
      </Box>

      <Box mt="sm">
        <Divider mb="sm" />
        <Button variant="default" fullWidth onClick={onSignOut}>
          Sign out
        </Button>
      </Box>
    </Stack>
  );
}
