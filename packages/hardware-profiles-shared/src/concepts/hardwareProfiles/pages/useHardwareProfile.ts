import React from 'react';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { getHardwareProfile } from '#~/api/k8s/hardwareProfiles';

const useHardwareProfile = (
  namespace: string,
  name?: string,
): FetchState<HardwareProfileKind | null> => {
  const callback = React.useCallback<FetchStateCallbackPromise<HardwareProfileKind | null>>(() => {
    if (!name || !namespace) {
      return Promise.reject(new NotReadyError('Hardware profile name or namespace is missing'));
    }

    return getHardwareProfile(name, namespace);
  }, [name, namespace]);

  return useFetchState(callback, null);
};

export default useHardwareProfile;
