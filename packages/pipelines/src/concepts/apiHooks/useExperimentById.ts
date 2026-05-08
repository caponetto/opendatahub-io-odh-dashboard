import * as React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const useExperimentById = (experimentId?: string): FetchState<ExperimentKF | null> => {
  const { api } = usePipelinesAPI();

  const call = React.useCallback<FetchStateCallbackPromise<ExperimentKF | null>>(
    (opts) => {
      if (!experimentId) {
        return Promise.reject(new NotReadyError('No experiment id'));
      }

      return api.getExperiment(opts, experimentId);
    },
    [api, experimentId],
  );

  return useFetchState(call, null);
};

export default useExperimentById;
