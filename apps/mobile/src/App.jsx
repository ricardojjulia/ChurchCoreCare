import { useEffect, useState } from 'react';
import { Box, Center, Loader } from '@mantine/core';
import { CalendarDays, NotebookPen, Users, UserCircle } from 'lucide-react';
import { useAuth } from './lib/useAuth.js';
import { usePushNotifications } from './lib/usePushNotifications.js';
import LoginPage from './pages/LoginPage.jsx';
import ScheduleTab from './pages/ScheduleTab.jsx';
import ClientsTab from './pages/ClientsTab.jsx';
import NotesTab from './pages/NotesTab.jsx';
import ProfileTab from './pages/ProfileTab.jsx';
import { api } from './lib/api.js';

const TABS = [
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'clients',  label: 'Clients',  icon: Users },
  { id: 'notes',    label: 'Notes',    icon: NotebookPen },
  { id: 'profile',  label: 'Profile',  icon: UserCircle },
];

const tabBarStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  borderTop: '1px solid var(--mantine-color-gray-3)',
  background: 'var(--mantine-color-white)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  zIndex: 100,
};

const tabButtonStyle = (active) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 0',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)',
  fontSize: '10px',
  gap: '2px',
  WebkitTapHighlightColor: 'transparent',
});

export default function App() {
  const { user, login, logout } = useAuth();
  const [tab, setTab] = useState('schedule');
  const [clients, setClients] = useState([]);
  usePushNotifications(user);

  useEffect(() => {
    if (!user) return;
    api.searchClients('').catch(() => {}).then((data) => {
      if (data) setClients(data.items ?? data.clients ?? []);
    });
  }, [user]);

  if (user === undefined) {
    return <Center h="100dvh"><Loader /></Center>;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  const contentStyle = {
    paddingBottom: `calc(60px + env(safe-area-inset-bottom, 0px))`,
    minHeight: '100dvh',
    background: 'var(--mantine-color-gray-0)',
  };

  return (
    <Box>
      <Box style={contentStyle}>
        {tab === 'schedule' && <ScheduleTab />}
        {tab === 'clients'  && <ClientsTab />}
        {tab === 'notes'    && <NotesTab clients={clients} />}
        {tab === 'profile'  && <ProfileTab user={user} onLogout={logout} />}
      </Box>

      <nav style={tabBarStyle}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            style={tabButtonStyle(tab === id)}
            onClick={() => setTab(id)}
            aria-label={label}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </Box>
  );
}
