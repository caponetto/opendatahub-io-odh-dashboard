import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useMLflowStatus } from './useMLflowStatus';

type MlflowCRAvailability = {
  available: boolean;
  loaded: boolean;
};

const useIsMlflowCRAvailable = (): MlflowCRAvailability => {
  const isAreaAvailable = useIsAreaAvailable(SupportedArea.MLFLOW).status;
  const { configured, loaded } = useMLflowStatus(isAreaAvailable);

  return {
    available: isAreaAvailable && loaded && configured,
    loaded: !isAreaAvailable || loaded,
  };
};

export default useIsMlflowCRAvailable;
