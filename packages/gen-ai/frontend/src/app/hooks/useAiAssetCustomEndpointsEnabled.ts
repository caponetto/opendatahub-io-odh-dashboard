import { useFeatureFlag } from '@odh-dashboard/plugin-core';
import { AI_ASSET_CUSTOM_ENDPOINTS } from '~/odh/extensions';

const useAiAssetCustomEndpointsEnabled = (): boolean => {
  const [aiAssetCustomEndpointsEnabled] = useFeatureFlag(AI_ASSET_CUSTOM_ENDPOINTS);
  return aiAssetCustomEndpointsEnabled;
};

export default useAiAssetCustomEndpointsEnabled;
