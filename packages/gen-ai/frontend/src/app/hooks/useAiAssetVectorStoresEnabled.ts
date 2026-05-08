import { useFeatureFlag } from '@odh-dashboard/plugin-core';
import { EXTERNAL_VECTOR_STORES } from '~/odh/extensions';

const useAiAssetVectorStoresEnabled = (): boolean => {
  const [aiAssetVectorStoresEnabled] = useFeatureFlag(EXTERNAL_VECTOR_STORES);
  return aiAssetVectorStoresEnabled;
};

export default useAiAssetVectorStoresEnabled;
