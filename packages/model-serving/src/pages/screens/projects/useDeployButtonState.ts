import {
  useIsAreaAvailable,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { getDeployButtonState } from '@odh-dashboard/model-serving-shared/concepts/modelCatalog/utils';
import useServingPlatformStatuses from '../../useServingPlatformStatuses';

/**
 * Returns the deploy button state (visible, enabled, tooltip) for model deploy actions.
 * @param isOciModel - Whether the model is an OCI model (use isOciModelUri or similar).
 */
const useDeployButtonState = (
  isOciModel: boolean,
): { visible: boolean; enabled?: boolean; tooltip?: string } => {
  const isModelServingEnabled = useIsAreaAvailable(SupportedArea.MODEL_SERVING).status;
  const { platformEnabledCount, kServe } = useServingPlatformStatuses();

  return getDeployButtonState({
    isModelServingEnabled,
    platformEnabledCount,
    isKServeEnabled: kServe.enabled,
    isOciModel,
  });
};

export default useDeployButtonState;
