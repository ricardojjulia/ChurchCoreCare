import { useState, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Metrics from './components/Metrics';
import WorkspaceGrid from './components/WorkspaceGrid';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [metricsData, setMetricsData] = useState({
    sessions: 0,
    appointmentTypes: 0,
    auditEvents: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [clientsData, setClientsData] = useState({
    items: [],
    loading: true,
    error: null,
  });
  const [refreshClientsKey, setRefreshClientsKey] = useState(0);

  useEffect(() => {
    // Check API connection
    fetch('/api/health')
      .then(() => setConnectionStatus('connected'))
      .catch(() => setConnectionStatus('error'));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    fetch('/api/v1/clients')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load clients');
        }
        return response.json();
      })
      .then((payload) => {
        if (isCancelled) return;
        setClientsData({
          items: Array.isArray(payload?.items) ? payload.items : [],
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setClientsData({
          items: [],
          loading: false,
          error: 'Unable to load clients',
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshClientsKey]);

  const handleAuthContinue = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (!isAuthenticated) {
    return <AuthGate onContinue={handleAuthContinue} />;
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userRole={userRole}
        onSignOut={handleSignOut}
      />
      <main className="main-content">
        <TopBar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          connectionStatus={connectionStatus}
        />
        <Metrics data={metricsData} />
        <WorkspaceGrid clientsData={clientsData} onClientsUpdated={() => setRefreshClientsKey((k) => k + 1)} />
      </main>
    </div>
  );
}
