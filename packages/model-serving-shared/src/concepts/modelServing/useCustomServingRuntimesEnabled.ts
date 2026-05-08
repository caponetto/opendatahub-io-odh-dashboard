import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const useCustomServingRuntimesEnabled = (): boolean =>
  useIsAreaAvailable(SupportedArea.CUSTOM_RUNTIMES).status;

export default useCustomServingRuntimesEnabled;
