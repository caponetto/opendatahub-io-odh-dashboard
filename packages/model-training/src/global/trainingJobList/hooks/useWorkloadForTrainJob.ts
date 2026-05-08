import * as React from 'react';
import { WorkloadKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { WorkloadModel } from '@odh-dashboard/distributed-workloads-shared/api/models/kueue';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { TrainJobKind } from '../../../k8sTypes';
import { UnifiedJobKind } from '../../../types';

/**
 * Generic hook: watch the Kueue Workload for any job type (TrainJob or RayJob).
 * Kueue labels every workload with kueue.x-k8s.io/job-uid (preferred) or
 * kueue.x-k8s.io/job-name (fallback). Non-Kueue jobs return an empty list.
 */
export const useWorkloadForJob = (
  job: UnifiedJobKind | null,
): CustomWatchK8sResult<WorkloadKind[]> => {
  const selector = React.useMemo(() => {
    if (!job) return undefined;
    if (job.metadata.uid) {
      const matchLabels: Record<string, string> = { 'kueue.x-k8s.io/job-uid': job.metadata.uid };
      return { matchLabels };
    }
    const matchLabels: Record<string, string> = { 'kueue.x-k8s.io/job-name': job.metadata.name };
    return { matchLabels };
  }, [job]);

  return useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(WorkloadModel),
      namespace: job?.metadata.namespace,
      ...(selector && { selector }),
    },
    WorkloadModel,
  );
};

export const useWorkloadForTrainJob = (
  job: TrainJobKind | null,
): CustomWatchK8sResult<WorkloadKind[]> => useWorkloadForJob(job);

export const useWorkload = (job: UnifiedJobKind | null): WorkloadKind | null => {
  const [workloads, loaded] = useWorkloadForJob(job);
  const safeWorkloads = React.useMemo(() => workloads ?? [], [workloads]);
  return React.useMemo(() => {
    if (!loaded || safeWorkloads.length === 0) return null;
    return safeWorkloads[0];
  }, [safeWorkloads, loaded]);
};
