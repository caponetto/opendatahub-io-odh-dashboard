import React from 'react';
import { IntegrationsStatusProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/integrations/IntegrationsStatusContext';
import { useAppBootstrap } from '@odh-dashboard/dashboard-shell-frontend/app/useAppBootstrap';
import { AppShell, AppShellWrapper } from '@odh-dashboard/dashboard-shell-frontend/app/AppShell';

const SlimRouteWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <IntegrationsStatusProvider>{children}</IntegrationsStatusProvider>
);

const SlimApp: React.FC = () => {
  const bootstrap = useAppBootstrap();
  return <AppShell bootstrap={bootstrap} RouteWrapper={SlimRouteWrapper} />;
};

const SlimAppWrapper: React.FC = () => (
  <AppShellWrapper>
    <SlimApp />
  </AppShellWrapper>
);

export default SlimAppWrapper;
