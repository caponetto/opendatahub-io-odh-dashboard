import React from 'react';

import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

/**
 * Based on the pipeline associated with the provided pipelineId,
 * fetch the last created pipeline version associated with that pipeline
 */
export const useLatestPipelineVersion = (
  pipelineId: string | undefined,
): FetchState<PipelineVersionKF | null> => {
  const { api } = usePipelinesAPI();

  const getLatestVersion = React.useCallback<
    FetchStateCallbackPromise<PipelineVersionKF | null>
  >(async () => {
    if (!pipelineId) {
      return Promise.reject(new NotReadyError('No pipeline id'));
    }

    const response = await api.listPipelineVersions({}, pipelineId, {
      sortField: 'created_at',
      sortDirection: 'desc',
    });

    return response.pipeline_versions?.[0] || null;
  }, [api, pipelineId]);

  return useFetchState(getLatestVersion, null);
};
