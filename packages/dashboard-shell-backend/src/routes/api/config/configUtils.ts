import { PatchUtils } from '@kubernetes/client-node';
import {
  getDashboardConfig,
  updateDashboardConfig,
} from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';
import {
  KubeFastifyInstance,
  DashboardConfig,
  RecursivePartial,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

export const setDashboardConfig = async (
  fastify: KubeFastifyInstance,
  request: RecursivePartial<DashboardConfig>,
): Promise<DashboardConfig> => {
  const options = {
    headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
  };
  await fastify.kube.customObjectsApi.patchNamespacedCustomObject(
    'opendatahub.io',
    'v1alpha',
    fastify.kube.namespace,
    'odhdashboardconfigs',
    'odh-dashboard-config',
    request,
    undefined,
    undefined,
    undefined,
    options,
  );
  await updateDashboardConfig();
  return getDashboardConfig();
};
