import { DEPLOY_BUTTON_TOOLTIP } from '#~/constants/deployButtonTooltip';

export function getDeployButtonState({
  isModelServingEnabled,
  platformEnabledCount,
  isKServeEnabled,
  isOciModel,
}: {
  isModelServingEnabled: boolean;
  platformEnabledCount: number;
  isKServeEnabled: boolean;
  isOciModel: boolean;
}): { visible: boolean; enabled?: boolean; tooltip?: string } {
  if (!isModelServingEnabled) {
    return { visible: false };
  }
  if (platformEnabledCount === 0) {
    return {
      visible: true,
      enabled: false,
      tooltip: DEPLOY_BUTTON_TOOLTIP.ENABLE_MODEL_SERVING_PLATFORM,
    };
  }
  if (isOciModel && !isKServeEnabled) {
    return {
      visible: true,
      enabled: false,
      tooltip: DEPLOY_BUTTON_TOOLTIP.ENABLE_SINGLE_MODEL_SERVING,
    };
  }
  return { visible: true, enabled: true };
}
