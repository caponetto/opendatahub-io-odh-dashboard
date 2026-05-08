import * as React from 'react';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { DEFAULT_LIST_WATCH_RESULT } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { useWatchHardwareProfiles } from '#~/utilities/useWatchHardwareProfiles';

export type HardwareProfilesContextType = {
  globalHardwareProfiles: CustomWatchK8sResult<HardwareProfileKind[]>;
};

export const HardwareProfilesContext = React.createContext<HardwareProfilesContextType>({
  globalHardwareProfiles: DEFAULT_LIST_WATCH_RESULT,
});

export const HardwareProfilesContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { dashboardNamespace } = useDashboardNamespace();
  const globalHardwareProfiles = useWatchHardwareProfiles(dashboardNamespace);
  const contextValue = React.useMemo(
    () => ({
      globalHardwareProfiles,
    }),
    [globalHardwareProfiles],
  );
  return (
    <HardwareProfilesContext.Provider value={contextValue}>
      {children}
    </HardwareProfilesContext.Provider>
  );
};
