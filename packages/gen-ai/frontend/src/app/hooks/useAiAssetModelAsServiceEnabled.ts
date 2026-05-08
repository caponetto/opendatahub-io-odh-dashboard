import { useFeatureFlag } from '@odh-dashboard/plugin-core';
import { MODEL_AS_SERVICE_CAMEL } from '~/odh/extensions';

const useAiAssetModelAsServiceEnabled = (): boolean => {
  const [modelAsServiceEnabled] = useFeatureFlag(MODEL_AS_SERVICE_CAMEL);
  return modelAsServiceEnabled;
};

export default useAiAssetModelAsServiceEnabled;
