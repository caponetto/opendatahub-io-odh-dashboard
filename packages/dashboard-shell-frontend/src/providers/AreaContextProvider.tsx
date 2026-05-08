import * as React from 'react';
import { Bullseye, Page, Spinner } from '@patternfly/react-core';
import { useExtensions } from '@odh-dashboard/plugin-core';
import { isAreaExtension } from '@odh-dashboard/plugin-core/extension-points';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useAppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';
import RedirectErrorState from '@odh-dashboard/dashboard-foundation-frontend/pages/external/RedirectErrorState';
import {
  useFetchDscStatus,
  useFetchDsciStatus,
  getFlags,
  isAreaAvailable,
  SupportedAreasStateMap,
  AreaContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type {
  IsAreaAvailableStatus,
  SupportedAreaType,
  SupportedComponentFlagValue,
  FlagState,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type {
  DataScienceClusterInitializationKindStatus,
  DataScienceClusterKindStatus,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useDeepCompareMemoize } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useDeepCompareMemoize';

type InnerProps = {
  dscStatus: DataScienceClusterKindStatus | null;
  dsciStatus: DataScienceClusterInitializationKindStatus | null;
  flags?: FlagState | null;
  children: React.ReactNode;
};

const Inner: React.FC<InnerProps> = ({ dscStatus, dsciStatus, flags, children }) => {
  const { dashboardConfig } = useAppContext();
  const dashboardConfigSpecSafe = useDeepCompareMemoize(dashboardConfig.spec);
  const dscStatusSafe = useDeepCompareMemoize(dscStatus);
  const dsciStatusSafe = useDeepCompareMemoize(dsciStatus);
  const areasExtensions = useExtensions(isAreaExtension);

  const configFlags = React.useMemo(
    () => getFlags(dashboardConfigSpecSafe),
    [dashboardConfigSpecSafe],
  );

  const flagState = React.useMemo(
    () => ({
      ...configFlags,
      ...flags,
    }),
    [configFlags, flags],
  );

  const stateMap = React.useMemo(
    () => ({
      ...SupportedAreasStateMap,
      ...areasExtensions.reduce<Record<string, SupportedComponentFlagValue>>((acc, extension) => {
        acc[extension.properties.id] = extension.properties;
        return acc;
      }, {}),
    }),
    [areasExtensions],
  );

  const areasStatus = React.useMemo(
    () =>
      Object.keys(stateMap).reduce<Record<SupportedAreaType, IsAreaAvailableStatus>>(
        (acc, area) => {
          acc[area] = isAreaAvailable(
            area,
            dashboardConfigSpecSafe,
            dscStatusSafe,
            dsciStatusSafe,
            {
              internalStateMap: stateMap,
              flagState,
            },
          );
          return acc;
        },
        {},
      ),
    [dashboardConfigSpecSafe, dscStatusSafe, dsciStatusSafe, stateMap, flagState],
  );

  const contextValue = React.useMemo(
    () => ({ dscStatus, dsciStatus, areasStatus }),
    [dscStatus, dsciStatus, areasStatus],
  );

  return <AreaContext.Provider value={contextValue}>{children}</AreaContext.Provider>;
};

type AreaContextProviderProps = {
  flags?: FlagState | null;
  children: React.ReactNode;
};

const AreaContextProvider: React.FC<AreaContextProviderProps> = ({ flags, children }) => {
  const [dscStatus, loadedDsc, errorDsc] = useFetchDscStatus();
  const [dsciStatus, loadedDsci, errorDsci] = useFetchDsciStatus();

  const error = errorDsc || errorDsci;
  const loaded = loadedDsc && loadedDsci;

  if (error || (loaded && (!dscStatus || Object.keys(dscStatus).length === 0))) {
    return (
      <Page>
        <ApplicationsPage loaded empty={false}>
          <RedirectErrorState
            title="Could not load component state"
            errorMessage={error?.message}
          />
        </ApplicationsPage>
      </Page>
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <Inner dscStatus={dscStatus} dsciStatus={dsciStatus} flags={flags}>
      {children}
    </Inner>
  );
};
export default AreaContextProvider;
