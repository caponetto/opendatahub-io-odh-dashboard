import { K8sResourceCommon, K8sResourceListResult } from '@odh-dashboard/k8s-browser';

export const mockK8sResourceList = <TResource extends K8sResourceCommon>(
  resources: TResource[],
  options?: {
    namespace?: string;
  },
): K8sResourceListResult<TResource> => ({
  apiVersion: resources.length > 0 ? resources[0].apiVersion ?? 'v1' : 'v1',
  kind: resources.length > 0 ? `${resources[0].kind ?? 'Resource'}List` : 'List',
  metadata: {
    continue: '',
    resourceVersion: '1462210',
  },
  items: options?.namespace
    ? resources.map((r) => ({ ...r, metadata: { ...r.metadata, namespace: options.namespace } }))
    : resources,
});
