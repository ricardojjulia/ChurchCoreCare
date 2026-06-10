import { useState, useEffect, useCallback } from 'react';
import { NavLink, Stack, Text, Group, Button, Box, Divider, Badge, Collapse } from '@mantine/core';
import {
  Users, Heart, Building2, BookOpen, Globe, Calendar, ChevronDown, ChevronRight,
  LayoutDashboard, ClipboardList, Clock, FileText, BarChart2, Sun, UserCog,
} from 'lucide-react';
import { useI18n } from '../lib/i18nContext.jsx';
import { isAdminRole, isClientRole, isCounselorRole, isOperationsStaffRole } from '../lib/roles.js';

const STORAGE_KEY = 'churchcore.sidebar.openSections';

// ── Nav group definitions ─────────────────────────────────────────────────────

function getNavGroupsForRole(role) {
  if (isClientRole(role)) {
    return [
      { key: 'root', items: [{ key: 'portal', labelKey: 'nav.portal' }] },
    ];
  }

  if (isCounselorRole(role)) {
    return [
      {
        key: 'root',
        items: [
          { key: 'counselor-home', labelKey: 'nav.home' },
          { key: 'tasks', labelKey: 'nav.tasks' },
        ],
      },
      {
        key: 'my-clients',
        icon: Heart,
        labelKey: 'nav.section.myClients',
        items: [
          { key: 'clients', labelKey: 'nav.clients' },
          { key: 'clinical', labelKey: 'nav.clinical' },
          { key: 'documents', labelKey: 'nav.documents' },
          { key: 'groups', labelKey: 'nav.groups' },
        ],
      },
      {
        key: 'my-schedule',
        icon: Calendar,
        labelKey: 'nav.section.mySchedule',
        items: [
          { key: 'scheduling', labelKey: 'nav.scheduling' },
          { key: 'time-tracking', labelKey: 'nav.timeTracking' },
        ],
      },
    ];
  }

  if (isAdminRole(role)) {
    return [
      {
        key: 'root',
        items: [{ key: 'dashboard', labelKey: 'nav.dashboard' }],
      },
      {
        key: 'care-team',
        icon: Users,
        labelKey: 'nav.section.careTeam',
        items: [
          { key: 'counselors', labelKey: 'nav.counselors' },
          { key: 'scheduling', labelKey: 'nav.scheduling' },
          { key: 'time-tracking', labelKey: 'nav.timeTracking' },
        ],
      },
      {
        key: 'clients-section',
        icon: Heart,
        labelKey: 'nav.section.clients',
        items: [
          { key: 'clients', labelKey: 'nav.clients' },
          { key: 'clinical', labelKey: 'nav.clinical' },
          { key: 'documents', labelKey: 'nav.documents' },
          { key: 'groups', labelKey: 'nav.groups' },
        ],
      },
      {
        key: 'practice-section',
        icon: Building2,
        labelKey: 'nav.section.practice',
        items: [
          { key: 'workspace-studio', labelKey: 'nav.workspaceStudio' },
          { key: 'users', labelKey: 'nav.users' },
          { key: 'offerings', labelKey: 'nav.offerings' },
          { key: 'operations', labelKey: 'nav.operationsStudio', href: '/operations.html' },
        ],
      },
      {
        key: 'ministry-tools',
        icon: BookOpen,
        labelKey: 'nav.section.ministryTools',
        items: [
          { key: 'faith', labelKey: 'nav.faithWorkflows' },
          { key: 'analytics', labelKey: 'nav.analytics' },
        ],
      },
      {
        key: 'portal-section',
        icon: Globe,
        labelKey: 'nav.section.portal',
        items: [
          { key: 'portal', labelKey: 'nav.portal' },
        ],
      },
    ];
  }

  if (isOperationsStaffRole(role)) {
    return [
      {
        key: 'root',
        items: [
          { key: 'dashboard', labelKey: 'nav.dashboard' },
          { key: 'clients', labelKey: 'nav.clients' },
          { key: 'scheduling', labelKey: 'nav.scheduling' },
          { key: 'documents', labelKey: 'nav.documents' },
          { key: 'portal', labelKey: 'nav.portal' },
        ],
      },
    ];
  }

  return [
    {
      key: 'root',
      items: [
        { key: 'dashboard', labelKey: 'nav.dashboard' },
        { key: 'clients', labelKey: 'nav.clients' },
        { key: 'scheduling', labelKey: 'nav.scheduling' },
        { key: 'clinical', labelKey: 'nav.clinical' },
        { key: 'documents', labelKey: 'nav.documents' },
      ],
    },
  ];
}

/** Section key containing the given nav item key. */
function findSectionForView(groups, viewKey) {
  for (const group of groups) {
    if (group.key === 'root') continue;
    if (group.items?.some((item) => item.key === viewKey)) return group.key;
  }
  return null;
}

// ── User label helper ─────────────────────────────────────────────────────────

function resolveUserLabel(user, role) {
  const normalizedRole = role ? role.replaceAll('_', ' ') : null;
  if (typeof user?.name === 'string' && user.name.trim()) {
    return normalizedRole ? `${user.name.trim()} • ${normalizedRole}` : user.name.trim();
  }
  if (typeof user?.email === 'string' && user.email.trim()) {
    return normalizedRole ? `${user.email.trim()} • ${normalizedRole}` : user.email.trim();
  }
  return null;
}

// ── Collapsible section ───────────────────────────────────────────────────────

function NavSection({ group, isOpen, onToggle, currentView, onNavigate, t }) {
  const Icon = group.icon;
  return (
    <Box>
      <Box
        component="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '6px 8px',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--mantine-color-dimmed)',
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        aria-expanded={isOpen}
      >
        {Icon && <Icon size={12} aria-hidden="true" />}
        <Text
          component="span"
          size="xs"
          fw={700}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: '0.08em', flex: 1, textAlign: 'left' }}
        >
          {t(group.labelKey)}
        </Text>
        {isOpen
          ? <ChevronDown size={12} aria-hidden="true" />
          : <ChevronRight size={12} aria-hidden="true" />
        }
      </Box>

      <Collapse expanded={isOpen}>
        <Stack gap={2} pl={8} pt={2} pb={4}>
          {group.items.map((item) =>
            item.href ? (
              <NavLink
                key={item.key}
                data-nav-key={item.key}
                component="a"
                href={item.href}
                label={t(item.labelKey)}
                styles={{ root: { borderRadius: 6, fontSize: 'var(--mantine-font-size-sm)' } }}
              />
            ) : (
              <NavLink
                key={item.key}
                data-nav-key={item.key}
                label={t(item.labelKey)}
                active={currentView === item.key}
                onClick={() => onNavigate?.(item.key)}
                styles={{ root: { borderRadius: 6, fontSize: 'var(--mantine-font-size-sm)' } }}
              />
            )
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar({ currentUser, currentView, onNavigate, onSignOut, connectionStatus }) {
  const { t } = useI18n();
  const userRole = currentUser?.role ?? null;
  const groups = getNavGroupsForRole(userRole);

  // Determine which collapsible sections start open.
  // Rules: (1) persist to localStorage; (2) always expand the section containing the active view.
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch { /* ignore */ }
    // Default: open all sections
    return Object.fromEntries(groups.filter((g) => g.key !== 'root').map((g) => [g.key, true]));
  });

  // Auto-open the section containing the current view
  useEffect(() => {
    const ownerSection = findSectionForView(groups, currentView);
    if (ownerSection && !openSections[ownerSection]) {
      setOpenSections((prev) => {
        const next = { ...prev, [ownerSection]: true };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
  }, [currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = useCallback((key) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const CONNECTION_TONE = {
    loading:   { color: 'gray',  label: t('sidebar.connection.loading') },
    connected: { color: 'green', label: t('sidebar.connection.connected') },
    error:     { color: 'red',   label: t('sidebar.connection.error') },
  };
  const connectionTone = CONNECTION_TONE[connectionStatus] ?? CONNECTION_TONE.loading;
  const userLabel = resolveUserLabel(currentUser, userRole)
    ?? (userRole
      ? t('sidebar.user.signedInAs', { role: userRole.replaceAll('_', ' ') })
      : t('sidebar.user.notSignedIn'));

  return (
    <Stack h="100%" gap={0} p="sm">
      <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 8 }}>

        {/* Brand mark */}
        <Group gap="sm" mb="md" px="xs" className="sidebar-options-head">
          <Box className="sidebar-options-mark" aria-hidden="true">
            <span className="sidebar-options-glow"></span>
            <span className="sidebar-options-person sidebar-options-person--left"></span>
            <span className="sidebar-options-person sidebar-options-person--right"></span>
            <span className="sidebar-options-wave"></span>
          </Box>
          <Box>
            <Text fw={800} fz="sm" lh={1.1}>{t('sidebar.options')}</Text>
          </Box>
        </Group>

        {/* User badge */}
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
          {userLabel}
        </Text>

        {/* Connection status */}
        <Box px="xs" mb="sm">
          <Badge color={connectionTone.color} variant="light" radius="xl" size="md">
            {connectionTone.label}
          </Badge>
        </Box>

        {/* Navigation */}
        <Box component="nav" aria-label={t('sidebar.primaryNav')}>
          {groups.map((group) => {
            if (group.key === 'root') {
              // Ungrouped top-level items (no section header)
              return (
                <Stack key="root" gap={2} mb={8}>
                  {group.items.map((item) =>
                    item.href ? (
                      <NavLink
                        key={item.key}
                        data-nav-key={item.key}
                        component="a"
                        href={item.href}
                        label={t(item.labelKey)}
                        styles={{ root: { borderRadius: 8 } }}
                      />
                    ) : (
                      <NavLink
                        key={item.key}
                        data-nav-key={item.key}
                        label={t(item.labelKey)}
                        active={currentView === item.key}
                        onClick={() => onNavigate?.(item.key)}
                        styles={{ root: { borderRadius: 8 } }}
                      />
                    )
                  )}
                </Stack>
              );
            }

            return (
              <Box key={group.key} mb={4}>
                <NavSection
                  group={group}
                  isOpen={openSections[group.key] ?? true}
                  onToggle={() => toggleSection(group.key)}
                  currentView={currentView}
                  onNavigate={onNavigate}
                  t={t}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Sign out */}
      <Box mt="sm">
        <Divider mb="sm" />
        <Button variant="default" fullWidth onClick={onSignOut}>
          {t('header.signOut')}
        </Button>
      </Box>
    </Stack>
  );
}
