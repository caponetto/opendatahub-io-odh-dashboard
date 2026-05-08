import * as React from 'react';
import { ClusterQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetchState, {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { listClusterQueues } from '@odh-dashboard/distributed-workloads-shared/api/k8s/clusterQueues';
import useDistributedWorkloadsEnabled from '@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled';

const useClusterQueues = (refreshRate = 0): FetchState<ClusterQueueKind[]> => {
  const dwEnabled = useDistributedWorkloadsEnabled();
  return useFetchState<ClusterQueueKind[]>(
    React.useCallback(() => {
      if (!dwEnabled) {
        return Promise.reject(new NotReadyError('Workload metrics is not enabled'));
      }
      return listClusterQueues();
    }, [dwEnabled]),
    [],
    { refreshRate },
  );
};

export default useClusterQueues;
