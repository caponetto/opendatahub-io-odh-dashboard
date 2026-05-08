import { AxiosError } from 'axios';
import {
  DashboardConfigKind,
  DataScienceClusterKindStatus,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { DevFeatureFlags } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import useDetectUser from '@odh-dashboard/dashboard-foundation-frontend/utilities/useDetectUser';
import { useFetchDscStatus } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useApplicationSettings } from './useApplicationSettings';
import useDevFeatureFlags from './featureFlags/useDevFeatureFlags';

export type AppBootstrapState = {
  username: string;
  userError: Error | null;
  isAllowed: boolean;
  dashboardConfig: DashboardConfigKind | null;
  configLoaded: boolean;
  fetchConfigError: AxiosError | undefined;
  devFeatureFlagsProps: DevFeatureFlags;
  dscStatus: DataScienceClusterKindStatus | null;
};

export const useAppBootstrap = (): AppBootstrapState => {
  const { username, userError, isAllowed } = useUser();
  const {
    dashboardConfig: dashboardConfigFromServer,
    loaded: configLoaded,
    loadError: fetchConfigError,
    refresh,
  } = useApplicationSettings();

  const { dashboardConfig, ...devFeatureFlagsProps } = useDevFeatureFlags(
    dashboardConfigFromServer,
    refresh,
  );

  useDetectUser();

  const [dscStatus] = useFetchDscStatus();

  return {
    username,
    userError,
    isAllowed,
    dashboardConfig,
    configLoaded,
    fetchConfigError,
    devFeatureFlagsProps,
    dscStatus,
  };
};
