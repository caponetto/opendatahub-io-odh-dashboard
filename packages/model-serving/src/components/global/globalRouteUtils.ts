import { GLOBAL_DEPLOYMENTS_PATH } from '@odh-dashboard/model-serving-shared/deploymentRoutes';

export const getGlobalDeploymentsPath = (namespace?: string): string => {
  return namespace ? `${GLOBAL_DEPLOYMENTS_PATH}/${namespace}` : GLOBAL_DEPLOYMENTS_PATH;
};
