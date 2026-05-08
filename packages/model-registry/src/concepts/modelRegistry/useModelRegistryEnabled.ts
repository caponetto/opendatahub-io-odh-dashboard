import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const useModelRegistryEnabled = (): boolean =>
  useIsAreaAvailable(SupportedArea.MODEL_REGISTRY).status;

export default useModelRegistryEnabled;
