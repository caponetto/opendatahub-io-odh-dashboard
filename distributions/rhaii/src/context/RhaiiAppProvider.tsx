import React, { type FC, type PropsWithChildren } from 'react';
import {
  IntegrationsContext,
  type IntegrationsStatusContextType,
} from '@odh-dashboard/plugin-core/integrations';
import ToastNotificationProvider from '@odh-dashboard/ui-core/contexts/ToastNotificationProvider';
import AppBootstrapProvider from './AppBootstrapProvider';
import HardwareProfilesContextProvider from './HardwareProfilesContextProvider';
import HostApiProvider from './HostApiProvider';
import ProjectsContextProvider from './ProjectsContextProvider';
import RhaiiAreaProvider from './RhaiiAreaProvider';
import TiltFixturesProvider from '../development/tilt/TiltFixturesProvider';

const integrationsContextValue: IntegrationsStatusContextType = {
  integrationStatus: {},
  loaded: true,
  error: undefined,
  refresh: () => Promise.resolve(undefined),
};

const RhaiiAppProvider: FC<PropsWithChildren> = ({ children }) => {
  const appContent =
    process.env.RHAII_TILT_FIXTURES === 'true' ? (
      <TiltFixturesProvider>{children}</TiltFixturesProvider>
    ) : (
      children
    );

  return (
    <IntegrationsContext.Provider value={integrationsContextValue}>
      <AppBootstrapProvider>
        <RhaiiAreaProvider>
          <HardwareProfilesContextProvider>
            <ProjectsContextProvider>
              <HostApiProvider>
                <ToastNotificationProvider>{appContent}</ToastNotificationProvider>
              </HostApiProvider>
            </ProjectsContextProvider>
          </HardwareProfilesContextProvider>
        </RhaiiAreaProvider>
      </AppBootstrapProvider>
    </IntegrationsContext.Provider>
  );
};

export default RhaiiAppProvider;
