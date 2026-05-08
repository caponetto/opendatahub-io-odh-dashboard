import * as React from 'react';
import { getDashboardPvcs } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pvcs';
import { PersistentVolumeClaimKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetch, {
  FetchOptions,
  FetchStateObject,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';

const useProjectPvcs = (
  namespace?: string,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<PersistentVolumeClaimKind[]> => {
  const getProjectPvcs = React.useCallback(() => {
    if (!namespace) {
      return Promise.reject(new NotReadyError('No namespace'));
    }

    return getDashboardPvcs(namespace);
  }, [namespace]);

  return useFetch<PersistentVolumeClaimKind[]>(getProjectPvcs, [], fetchOptions);
};

export default useProjectPvcs;
