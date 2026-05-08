import {
  DEFAULT_CULLER_TIMEOUT,
  DEFAULT_PVC_SIZE,
} from '@odh-dashboard/cluster-settings/pages/clusterSettings/const';
import { ClusterSettingsType } from '@odh-dashboard/dashboard-foundation-frontend/types';

export const mockClusterSettings = ({
  userTrackingEnabled = false,
  cullerTimeout = DEFAULT_CULLER_TIMEOUT,
  pvcSize = DEFAULT_PVC_SIZE,
  modelServingPlatformEnabled = {
    kServe: true,
    LLMd: true,
  },
  isDistributedInferencingDefault = true,
  defaultDeploymentStrategy = 'rolling',
}: Partial<ClusterSettingsType>): ClusterSettingsType => ({
  userTrackingEnabled,
  cullerTimeout,
  pvcSize,
  modelServingPlatformEnabled,
  isDistributedInferencingDefault,
  defaultDeploymentStrategy,
});
