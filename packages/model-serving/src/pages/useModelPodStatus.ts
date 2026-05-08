import * as React from 'react';
import useFetch, {
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { getPodsForKserve } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pods';
import { PodKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
/**
 * Hook to fetch the first predictor pod for a KServe InferenceService.
 * Returns { data: pod, loaded, error, refresh }.
 * If no pod is found, data is null.
 */
const useModelPodStatus = (
  namespace: string,
  inferenceServiceName: string,
): FetchStateObject<PodKind | null, Error> => {
  const fetchPod = React.useCallback(async () => {
    const pods = await getPodsForKserve(namespace, inferenceServiceName);
    return pods.length > 0 ? pods[0] : null;
  }, [namespace, inferenceServiceName]);

  return useFetch(fetchPod, null);
};

export default useModelPodStatus;
