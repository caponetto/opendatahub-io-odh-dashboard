import * as React from 'react';
import { LocalQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import useFetchState, {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { listLocalQueues } from '#~/api/k8s/localQueues';

const useLocalQueues = (namespace?: string, refreshRate = 0): FetchState<LocalQueueKind[]> => {
  const dwEnabled = useIsAreaAvailable(SupportedArea.DISTRIBUTED_WORKLOADS).status;
  return useFetchState<LocalQueueKind[]>(
    React.useCallback(() => {
      if (!dwEnabled) {
        return Promise.reject(new NotReadyError('Workload metrics is not enabled'));
      }
      if (!namespace) {
        return Promise.reject(new NotReadyError('No namespace'));
      }
      return listLocalQueues(namespace);
    }, [dwEnabled, namespace]),
    [],
    { refreshRate, initialPromisePurity: true },
  );
};

export default useLocalQueues;
