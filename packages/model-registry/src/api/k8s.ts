import { k8sGetResource, k8sListResource } from '@odh-dashboard/k8s-browser';
import {
  K8sAPIOptions,
  KnownLabels,
  ModelRegistryKind,
  ServiceKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';
import { ModelRegistryModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/odh';
import { ServiceModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models';

export const getModelRegistryCR = async (
  namespace: string,
  name: string,
  opts?: K8sAPIOptions,
): Promise<ModelRegistryKind> =>
  k8sGetResource<ModelRegistryKind>(
    applyK8sAPIOptions(
      {
        model: ModelRegistryModel,
        queryOptions: {
          ns: namespace,
          name,
        },
      },
      opts,
    ),
  );

export const listServices = async (namespace: string): Promise<ServiceKind[]> =>
  k8sListResource<ServiceKind>({
    model: ServiceModel,
    queryOptions: {
      ns: namespace,
      queryParams: { labelSelector: KnownLabels.LABEL_SELECTOR_MODEL_REGISTRY },
    },
  }).then((listResource) => listResource.items);
