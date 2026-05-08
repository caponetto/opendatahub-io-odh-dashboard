import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import { K8sResourceListResult } from '#~/k8sTypes';

export const addTypesToK8sListedResources = <TResource extends Partial<K8sResourceCommon>>(
  response: K8sResourceListResult<TResource>,
  kind: string,
): K8sResourceListResult<TResource> => ({
  ...response,
  items: response.items.map((i) => ({
    ...i,
    apiVersion: response.apiVersion,
    kind,
  })),
});
