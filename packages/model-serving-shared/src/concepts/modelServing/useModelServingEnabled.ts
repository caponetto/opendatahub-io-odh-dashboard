import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const useModelServingEnabled = (): boolean =>
  useIsAreaAvailable(SupportedArea.MODEL_SERVING).status;

export default useModelServingEnabled;
