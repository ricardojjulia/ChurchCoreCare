import { useEffect, useState } from 'react';
import { Tabs, Text } from '@mantine/core';
import PortalTab from './tabs/PortalTab.jsx';
import DocumentsStudioTab from './tabs/DocumentsStudioTab.jsx';
import OfferingsTab from './tabs/OfferingsTab.jsx';
import PracticeTab from './tabs/PracticeTab.jsx';
import LocationsTab from './tabs/LocationsTab.jsx';
import StaffTab from './tabs/StaffTab.jsx';
import LifecycleTab from './tabs/LifecycleTab.jsx';
import AppointmentsTab from './tabs/AppointmentsTab.jsx';
import ChartTab from './tabs/ChartTab.jsx';
import ClientsTab from './tabs/ClientsTab.jsx';
import FaithContextTab from './tabs/FaithContextTab.jsx';
import MinistryTab from './tabs/MinistryTab.jsx';
import SubscriptionTab from './tabs/SubscriptionTab.jsx';
import { useI18n } from '../../lib/i18nContext.jsx';
import { PageSurface, SectionSurface } from '../ui/surface.jsx';

const STUDIO_TABS = [
  { id: 'practice', labelKey: 'studio.tab.practice' },
  { id: 'locations', labelKey: 'studio.tab.locations', soloHidden: true },
  { id: 'staff', labelKey: 'studio.tab.staff', soloHidden: true },
  { id: 'lifecycle', labelKey: 'studio.tab.lifecycle' },
  { id: 'chart', labelKey: 'studio.tab.chart' },
  { id: 'documentsStudio', labelKey: 'studio.tab.documentsStudio' },
  { id: 'clients', labelKey: 'studio.tab.clients' },
  { id: 'appointments', labelKey: 'studio.tab.appointments' },
  { id: 'offerings', labelKey: 'studio.tab.offerings' },
  { id: 'portal', labelKey: 'studio.tab.portal' },
  { id: 'faith', labelKey: 'studio.tab.faith' },
  { id: 'ministry', labelKey: 'studio.tab.ministry' },
  { id: 'subscription', labelKey: 'studio.tab.subscription' },
];

export default function WorkspaceStudioPage({ initialTab = 'portal', onSchedulePortalRequest, onViewClient, onOpenCounselorMaintenance, initialDocumentsClientId = '', userRole = null, uiPersona = null }) {
  const { t } = useI18n();
  const isSolo = uiPersona === 'solo';
  const visibleTabs = STUDIO_TABS.filter((tab) => !(isSolo && tab.soloHidden));
  const [activeTab, setActiveTab] = useState(initialTab || 'portal');
  useEffect(() => {
    setActiveTab(initialTab || 'portal');
  }, [initialTab]);

  const pageTitle = isSolo ? t('nav.myPractice') : t('studio.title');

  return (
    <PageSurface title={pageTitle}>
      <SectionSurface>
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'portal')}>
          <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
            {visibleTabs.map((tab) => (
              <Tabs.Tab key={tab.id} value={tab.id} style={{ whiteSpace: 'nowrap' }}>
                {t(tab.labelKey)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {visibleTabs.map((tab) => (
            <Tabs.Panel key={tab.id} value={tab.id} pt="md">
              {tab.id === 'portal' ? (
                <PortalTab onSchedulePortalRequest={onSchedulePortalRequest} onViewClient={onViewClient} />
              ) : tab.id === 'documentsStudio' ? (
                <DocumentsStudioTab initialClientId={initialDocumentsClientId} />
              ) : tab.id === 'offerings' ? (
                <OfferingsTab />
              ) : tab.id === 'practice' ? (
                <PracticeTab />
              ) : tab.id === 'locations' ? (
                <LocationsTab />
              ) : tab.id === 'staff' ? (
                <StaffTab onOpenCounselorMaintenance={onOpenCounselorMaintenance} />
              ) : tab.id === 'lifecycle' ? (
                <LifecycleTab onOpenClient={onViewClient} />
              ) : tab.id === 'appointments' ? (
                <AppointmentsTab />
              ) : tab.id === 'chart' ? (
                <ChartTab />
              ) : tab.id === 'clients' ? (
                <ClientsTab onViewClient={onViewClient} />
              ) : tab.id === 'faith' ? (
                <FaithContextTab userRole={userRole} />
              ) : tab.id === 'ministry' ? (
                <MinistryTab userRole={userRole} />
              ) : tab.id === 'subscription' ? (
                <SubscriptionTab />
              ) : (
                <Text c="dimmed" fz="sm">{t('studio.placeholderForTab', { tab: t(tab.labelKey) })}</Text>
              )}
            </Tabs.Panel>
          ))}
        </Tabs>
      </SectionSurface>
    </PageSurface>
  );
}
