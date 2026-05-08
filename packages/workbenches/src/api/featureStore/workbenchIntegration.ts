import { proxyGET } from '@odh-dashboard/dashboard-foundation-frontend/api/proxyUtils';
import { K8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

export type WorkbenchFeatureStoreResponse = {
  namespaces: Array<{
    namespace: string;
    clientConfigs: Array<{
      configName: string;
      projectName: string;
      hasAccessToFeatureStore: boolean;
    }>;
  }>;
};

export const getWorkbenchFeatureStores = (
  opts?: K8sAPIOptions,
): Promise<WorkbenchFeatureStoreResponse> =>
  proxyGET<WorkbenchFeatureStoreResponse>('', '/api/featurestores/workbench-integration', {}, opts);
