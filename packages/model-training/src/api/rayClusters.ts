import { k8sGetResource } from '@odh-dashboard/k8s-browser';
import { RayClusterModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kubeflow';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';
import { RayClusterKind } from '../k8sTypes';

export const getRayCluster = (name: string, namespace: string): Promise<RayClusterKind> =>
  k8sGetResource<RayClusterKind>({
    model: RayClusterModel,
    queryOptions: { name, ns: namespace },
  });

export const useRayClusters = (namespace: string | null): CustomWatchK8sResult<RayClusterKind[]> =>
  useK8sWatchResourceList(
    namespace !== null
      ? {
          isList: true,
          groupVersionKind: groupVersionKind(RayClusterModel),
          namespace,
        }
      : null,
    RayClusterModel,
  );
