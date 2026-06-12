import { useEffect, useState } from 'react';
import { AppShell, Burger, Center, Group, Loader, NavLink, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Database, LayoutDashboard, LogOut, MessageSquareWarning, Shield, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from './lib/useAuth.js';
import LoginPage from './components/LoginPage.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import TenantsPage from './components/TenantsPage.jsx';
import ImpersonationPage from './components/ImpersonationPage.jsx';
import DataExportsPage from './components/DataExportsPage.jsx';
import RetentionPoliciesPage from './components/RetentionPoliciesPage.jsx';
import DemoFeedbackPage from './components/DemoFeedbackPage.jsx';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',          icon: LayoutDashboard, path: '/control' },
  { id: 'tenants',     label: 'Tenants',             icon: Users, path: '/control/tenants' },
  { id: 'impersonation', label: 'Impersonation',     icon: Shield, path: '/control/impersonation' },
  { id: 'exports',     label: 'Data Exports',        icon: Database, path: '/control/exports' },
  { id: 'retention',   label: 'Retention Policies',  icon: ShieldCheck, path: '/control/retention' },
  { id: 'demo-feedback', label: 'Demo Feedback', icon: MessageSquareWarning, path: '/control/demo-feedback' },
];

function pageFromPath(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname)?.id ?? 'dashboard';
}

export default function App() {
  const { user, login, logout } = useAuth();
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));
  const [opened, { toggle }] = useDisclosure();

  useEffect(() => {
    const onPopState = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (item) => {
    window.history.pushState({}, '', item.path);
    setPage(item.id);
    toggle();
  };

  if (user === undefined) {
    return <Center h="100vh"><Loader /></Center>;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  if (user.role !== 'platform_admin') {
    return (
      <Center h="100vh">
        <Text c="red">Access denied — platform_admin role required.</Text>
      </Center>
    );
  }

  const PAGES = {
    dashboard:    DashboardPage,
    tenants:      TenantsPage,
    impersonation: ImpersonationPage,
    exports:      DataExportsPage,
    retention:    RetentionPoliciesPage,
    'demo-feedback': DemoFeedbackPage,
  };
  const ActivePage = PAGES[page] ?? DashboardPage;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>ChurchCore Care — Platform Admin</Title>
          </Group>
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: 'pointer' }}
            onClick={logout}
          >
            Sign out
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {NAV_ITEMS.map((item) => {
          const { id, label, icon: Icon } = item;
          return (
          <NavLink
            key={id}
            label={label}
            leftSection={<Icon size={16} />}
            active={page === id}
            onClick={() => navigate(item)}
          />
          );
        })}
        <NavLink
          mt="auto"
          label="Sign out"
          leftSection={<LogOut size={16} />}
          onClick={logout}
          color="red"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <ActivePage />
      </AppShell.Main>
    </AppShell>
  );
}
