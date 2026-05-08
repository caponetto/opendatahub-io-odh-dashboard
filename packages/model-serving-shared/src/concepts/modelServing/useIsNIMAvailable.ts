import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useIsComponentIntegrationEnabled } from '@odh-dashboard/dashboard-foundation-frontend/concepts/integrations/useIsComponentIntegrationEnabled';

export const useIsNIMAvailable = (): [
  boolean,
  boolean,
  Error | undefined,
  () => Promise<boolean | undefined>,
] => {
  const isNIMModelServingAvailable = useIsAreaAvailable(SupportedArea.NIM_MODEL).status;

  const {
    isEnabled: isNIMAvailable,
    loaded,
    error,
    refresh: refreshNIMAvailability,
  } = useIsComponentIntegrationEnabled('nvidia-nim');

  return [isNIMAvailable && isNIMModelServingAvailable, loaded, error, refreshNIMAvailability];
};
