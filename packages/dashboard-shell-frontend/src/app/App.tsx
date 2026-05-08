import React from 'react';
import { useWatchBuildStatus } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useWatchBuildStatus';
import useStorageClasses from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useStorageClasses';
import { IntegrationsStatusProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/integrations/IntegrationsStatusContext';
import { NotificationWatcherContextProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notificationWatcher/NotificationWatcherContext';
import { useFederatedNotificationListener } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFederatedNotificationListener';
import { useAppBootstrap } from './useAppBootstrap';
import { AppShell, AppShellWrapper } from './AppShell';
import TelemetrySetup from './TelemetrySetup';
import QuickStarts from './QuickStarts';

const FullRouteWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <IntegrationsStatusProvider>
    <QuickStarts>
      <NotificationWatcherContextProvider>{children}</NotificationWatcherContextProvider>
    </QuickStarts>
  </IntegrationsStatusProvider>
);

const App: React.FC = () => {
  const bootstrap = useAppBootstrap();

  // TODO: TECH DEBT - Remove this once midstream uses mod-arch-core NotificationContext
  useFederatedNotificationListener();

  const buildStatuses = useWatchBuildStatus();
  const [storageClasses] = useStorageClasses();

  return (
    <AppShell
      bootstrap={bootstrap}
      buildStatuses={buildStatuses}
      storageClasses={storageClasses}
      RouteWrapper={FullRouteWrapper}
      extraContent={<TelemetrySetup />}
    />
  );
};

const AppWrapper: React.FC = () => (
  <AppShellWrapper>
    <App />
  </AppShellWrapper>
);

export default AppWrapper;
