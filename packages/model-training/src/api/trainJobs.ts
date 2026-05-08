import { k8sDeleteResource, K8sStatus } from '@odh-dashboard/k8s-browser';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';
import { K8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import { TrainJobModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kubeflow';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';

import { TrainJobKind } from '../k8sTypes';

/**
 * Watch TrainJobs in a namespace
 * @param namespace - The namespace to watch
 * @returns Custom watch result with TrainJob list
 */
export const useTrainJobs = (namespace: string | null): CustomWatchK8sResult<TrainJobKind[]> =>
  useK8sWatchResourceList(
    namespace !== null
      ? {
          isList: true,
          groupVersionKind: groupVersionKind(TrainJobModel),
          namespace,
        }
      : null,
    TrainJobModel,
  );

/**
 * Delete a TrainJob
 * @param name - The name of the TrainJob
 * @param namespace - The namespace of the TrainJob
 * @param opts - Optional K8s API options
 * @returns Promise with K8s status
 */
export const deleteTrainJob = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<K8sStatus> =>
  k8sDeleteResource<TrainJobKind, K8sStatus>(
    applyK8sAPIOptions(
      {
        model: TrainJobModel,
        queryOptions: { name, ns: namespace },
      },
      opts,
    ),
  );
