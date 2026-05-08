import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  getUrlFromKserveInferenceService,
  isInferenceServiceRouteEnabled,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import type { DeploymentEndpoint } from '@odh-dashboard/model-serving-shared/extension-points';

export const getKServeDeploymentEndpoints = (
  inferenceService: InferenceServiceKind,
): DeploymentEndpoint[] => {
  const endpoints: DeploymentEndpoint[] = [];
  if (inferenceService.status?.address?.url) {
    endpoints.push({
      name: 'Internal',
      description: 'Accessible only from inside the cluster.',
      type: 'internal',
      url: inferenceService.status.address.url,
    });
  } else {
    endpoints.push({
      name: 'Internal',
      description: 'Accessible only from inside the cluster.',
      type: 'internal',
      url: '',
      error: 'Could not find any internal service enabled',
    });
  }

  if (isInferenceServiceRouteEnabled(inferenceService)) {
    const routeUrl = getUrlFromKserveInferenceService(inferenceService);
    if (routeUrl) {
      endpoints.push({
        type: 'external',
        url: routeUrl,
      });
    } else {
      endpoints.push({
        type: 'external',
        url: '',
        error: 'Route not found',
      });
    }
  }
  return endpoints;
};
