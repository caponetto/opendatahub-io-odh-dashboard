import * as React from 'react';
import { WorkloadKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetchState, {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { listWorkloads } from '@odh-dashboard/distributed-workloads-shared/api/k8s/workloads';
import useDistributedWorkloadsEnabled from '@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled';

const useWorkloads = (namespace?: string, refreshRate = 0): FetchState<WorkloadKind[]> => {
  const dwEnabled = useDistributedWorkloadsEnabled();
  return useFetchState<WorkloadKind[]>(
    React.useCallback(() => {
      if (!dwEnabled) {
        return Promise.reject(new NotReadyError('Workload metrics is not enabled'));
      }
      if (!namespace) {
        return Promise.reject(new NotReadyError('No namespace'));
      }
      return listWorkloads(namespace);
    }, [dwEnabled, namespace]),
    [],
    { refreshRate, initialPromisePurity: true },
  );
};

export default useWorkloads;
