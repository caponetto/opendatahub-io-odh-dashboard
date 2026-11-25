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

const integrationsContextValue: IntegrationsStatusContextType = {
  integrationStatus: {},
  loaded: true,
  error: undefined,
  refresh: () => Promise.resolve(undefined),
};

const RhaiiAppProvider: FC<PropsWithChildren> = ({ children }) => (
  <IntegrationsContext.Provider value={integrationsContextValue}>
    <AppBootstrapProvider>
      <RhaiiAreaProvider>
        <HardwareProfilesContextProvider>
          <ProjectsContextProvider>
            <HostApiProvider>
              <ToastNotificationProvider>{children}</ToastNotificationProvider>
            </HostApiProvider>
          </ProjectsContextProvider>
        </HardwareProfilesContextProvider>
      </RhaiiAreaProvider>
    </AppBootstrapProvider>
  </IntegrationsContext.Provider>
);

export default RhaiiAppProvider;
