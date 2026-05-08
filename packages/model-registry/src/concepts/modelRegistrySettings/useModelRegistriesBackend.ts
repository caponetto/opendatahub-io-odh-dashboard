import React from 'react';
import useFetchState, {
  FetchState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { ModelRegistryKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { listModelRegistriesBackend } from '../../services/modelRegistrySettingsService';

const useModelRegistriesBackend = (): FetchState<ModelRegistryKind[]> => {
  const getModelRegistries = React.useCallback(() => listModelRegistriesBackend(), []);
  return useFetchState<ModelRegistryKind[]>(getModelRegistries, [], { refreshRate: POLL_INTERVAL });
};

export default useModelRegistriesBackend;
