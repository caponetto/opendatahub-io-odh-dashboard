import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { ClusterRoleKind } from '#~/k8sTypes';
import { ClusterRoleModel } from '#~/api/models/k8s';

export const listClusterRoles = (labelSelector?: string): Promise<ClusterRoleKind[]> => {
  const queryOptions = {
    ...(labelSelector && { queryParams: { labelSelector } }),
  };
  return k8sListResourceItems<ClusterRoleKind>({
    model: ClusterRoleModel,
    queryOptions,
  });
};
