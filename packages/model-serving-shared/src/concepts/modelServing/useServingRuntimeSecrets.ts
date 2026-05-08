import * as React from 'react';
import { getSecretsByLabel } from '@odh-dashboard/dashboard-foundation-frontend/api';
import type { SecretKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetch, {
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type {
  FetchOptions,
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { LABEL_SELECTOR_DASHBOARD_RESOURCE } from '@odh-dashboard/dashboard-foundation-frontend/const';
import useModelServingEnabled from './useModelServingEnabled';

const useServingRuntimeSecrets = (
  namespace?: string,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<SecretKind[]> => {
  const modelServingEnabled = useModelServingEnabled();

  const fetchSecrets = React.useCallback(() => {
    if (!namespace) {
      return Promise.reject(new NotReadyError('No namespace'));
    }

    if (!modelServingEnabled) {
      return Promise.reject(new NotReadyError('Model serving is not enabled'));
    }

    return getSecretsByLabel(LABEL_SELECTOR_DASHBOARD_RESOURCE, namespace);
  }, [namespace, modelServingEnabled]);

  return useFetch<SecretKind[]>(fetchSecrets, [], fetchOptions);
};

export default useServingRuntimeSecrets;
