import * as React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const usePipelineById = (pipelineId?: string): FetchState<PipelineKF | null> => {
  const { api } = usePipelinesAPI();

  const call = React.useCallback<FetchStateCallbackPromise<PipelineKF | null>>(
    (opts) => {
      if (!pipelineId) {
        return Promise.reject(new NotReadyError('No pipeline id'));
      }

      return api.getPipeline(opts, pipelineId);
    },
    [api, pipelineId],
  );

  return useFetchState(call, null);
};

export default usePipelineById;
