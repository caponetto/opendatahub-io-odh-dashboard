import React from 'react';
import '@patternfly/patternfly/patternfly.min.css';
import '@patternfly/patternfly/patternfly-addons.css';
import '@patternfly/patternfly/patternfly-charts.css';
import {
  Alert,
  AnimationsProvider,
  Bullseye,
  Button,
  Page,
  PageSection,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { DashboardConfigContext, useResolvedExtensions } from '@odh-dashboard/plugin-core';
import {
  isContextProviderExtension,
  ContextProviderExtension,
} from '@odh-dashboard/plugin-core/extension-points';
import ToastNotifications from '@odh-dashboard/dashboard-foundation-frontend/components/ToastNotifications';
import { DASHBOARD_MAIN_CONTAINER_ID } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import ProjectsContextProvider from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { AccessReviewProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/userSSAR';
import { BuildStatus, OdhPlatformType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { StorageClassKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { AppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';
import Header from './Header';
import AppRoutes from './AppRoutes';
import NavSidebar from './NavSidebar';
import AppNotificationDrawer from './AppNotificationDrawer';
import { logout } from './appUtils';
import SessionExpiredModal from './SessionExpiredModal';
import DevFeatureFlagsBanner from './featureFlags/DevFeatureFlagsBanner';
import type { AppBootstrapState } from './useAppBootstrap';
import { PluginStoreAreaFlagsProvider } from '../plugins/PluginStoreAreaFlagsProvider';
import { ExtensibilityContextProvider } from '../plugins/ExtensibilityContext';
import AreaContextProvider from '../providers/AreaContextProvider';
import ErrorBoundary from '../components/error/ErrorBoundary';

import './App.scss';

const ExtensionProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [contextProviders, resolved] = useResolvedExtensions<ContextProviderExtension>(
    isContextProviderExtension,
  );

  if (!resolved) {
    return <>{children}</>;
  }

  return contextProviders.reduce<React.ReactElement>((acc, ext) => {
    const Provider: React.ComponentType<React.PropsWithChildren> = ext.properties.provider;
    return <Provider>{acc}</Provider>;
  }, <>{children}</>);
};

export type AppShellProps = {
  bootstrap: AppBootstrapState;
  buildStatuses?: BuildStatus[];
  storageClasses?: StorageClassKind[];
  RouteWrapper?: React.ComponentType<React.PropsWithChildren>;
  extraContent?: React.ReactNode;
};

export const AppShell: React.FC<AppShellProps> = ({
  bootstrap: {
    username,
    userError,
    isAllowed,
    dashboardConfig,
    configLoaded,
    fetchConfigError,
    devFeatureFlagsProps,
    dscStatus,
  },
  buildStatuses = [],
  storageClasses = [],
  RouteWrapper,
  extraContent,
}) => {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const contextValue = React.useMemo(() => {
    if (!dashboardConfig) {
      return null;
    }
    const releaseName = dscStatus?.release?.name;
    const workbenchNamespace = dscStatus?.components?.workbenches?.workbenchNamespace;

    return {
      buildStatuses,
      dashboardConfig,
      workbenchNamespace,
      storageClasses,
      isRHOAI:
        releaseName === OdhPlatformType.SELF_MANAGED_RHOAI ||
        releaseName === OdhPlatformType.MANAGED_RHOAI,
    };
  }, [
    dashboardConfig,
    dscStatus?.release?.name,
    dscStatus?.components?.workbenches?.workbenchNamespace,
    buildStatuses,
    storageClasses,
  ]);

  const isUnauthorized = fetchConfigError?.request?.status === 403;

  if (userError || fetchConfigError) {
    if (isUnauthorized) {
      return <SessionExpiredModal />;
    }

    return (
      // TODO: Remove when PF breaking-change issue is fixed.
      // https://github.com/patternfly/patternfly-react/issues/11797
      // https://issues.redhat.com/browse/RHOAIENG-24716
      <Page sidebar={null}>
        <PageSection hasBodyWrapper={false}>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" isInline title="General loading error">
                <p>
                  {(userError ? userError.message : fetchConfigError?.message) ||
                    'Unknown error occurred during startup.'}
                </p>
                <p>Logging out and logging back in may solve the issue.</p>
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="secondary" onClick={() => logout()}>
                Logout
              </Button>
            </StackItem>
          </Stack>
        </PageSection>
      </Page>
    );
  }

  const loading = !username || !configLoaded || !dashboardConfig || !contextValue;

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const InnerWrapper = RouteWrapper ?? React.Fragment;

  return (
    <DashboardConfigContext.Provider value={dashboardConfig.spec}>
      <AppContext.Provider value={contextValue}>
        <AreaContextProvider flags={devFeatureFlagsProps.devFeatureFlags}>
          <PluginStoreAreaFlagsProvider />
          <AccessReviewProvider>
            <Page
              className="odh-dashboard"
              isManagedSidebar
              isContentFilled
              masthead={
                <Header
                  dashboardConfig={dashboardConfig.spec.dashboardConfig}
                  {...devFeatureFlagsProps}
                  onNotificationsClick={() => setNotificationsOpen(!notificationsOpen)}
                />
              }
              sidebar={isAllowed ? <NavSidebar /> : undefined}
              notificationDrawer={
                <AppNotificationDrawer onClose={() => setNotificationsOpen(false)} />
              }
              isNotificationDrawerExpanded={notificationsOpen}
              mainContainerId={DASHBOARD_MAIN_CONTAINER_ID}
              data-testid={DASHBOARD_MAIN_CONTAINER_ID}
              banner={
                <DevFeatureFlagsBanner
                  dashboardConfig={dashboardConfig.spec.dashboardConfig}
                  {...devFeatureFlagsProps}
                />
              }
            >
              <ErrorBoundary>
                <ProjectsContextProvider>
                  <ExtensionProviders>
                    <InnerWrapper>
                      <AppRoutes />
                    </InnerWrapper>
                  </ExtensionProviders>
                </ProjectsContextProvider>
                <ToastNotifications />
                {extraContent}
              </ErrorBoundary>
            </Page>
          </AccessReviewProvider>
        </AreaContextProvider>
      </AppContext.Provider>
    </DashboardConfigContext.Provider>
  );
};

export const AppShellWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ExtensibilityContextProvider>
    <AnimationsProvider config={{ hasAnimations: true }}>{children}</AnimationsProvider>
  </ExtensibilityContextProvider>
);
