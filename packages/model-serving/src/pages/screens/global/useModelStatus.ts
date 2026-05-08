import * as React from 'react';
import { getPodsForKserve } from '@odh-dashboard/dashboard-foundation-frontend/api';
import useFetchState, {
  FetchState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { ModelStatus } from '../types';
import { checkModelPodStatus } from '../../../concepts/kserve/kserveStatusUtils';

export const useModelStatus = (namespace: string, name: string): FetchState<ModelStatus | null> => {
  const fetchSecret = React.useCallback<() => Promise<ModelStatus | null>>(() => {
    return getPodsForKserve(namespace, name)
      .then((model) => checkModelPodStatus(model[0]))
      .catch((e) => {
        if (e.statusObject?.code === 404) {
          throw new Error(`Pod ${name} not found`);
        }
        throw e;
      });
  }, [namespace, name]);
  return useFetchState<ModelStatus | null>(fetchSecret, null);
};
