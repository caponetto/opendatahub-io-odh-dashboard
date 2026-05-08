import { k8sListResource } from '@odh-dashboard/k8s-browser';
import { StorageClassKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { StorageClassModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/k8s';

export const getStorageClasses = (): Promise<StorageClassKind[]> =>
  k8sListResource<StorageClassKind>({
    model: StorageClassModel,
    queryOptions: {},
  }).then((listResource) => listResource.items);
