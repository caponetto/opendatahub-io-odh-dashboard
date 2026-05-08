import * as React from 'react';
import {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineQuery from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineQuery';
import { PipelineListPaged, PipelineOptions } from '@odh-dashboard/pipelines/concepts/types';

const usePipelineVersionsForPipeline = (
  pipelineId?: string,
  options: PipelineOptions = {},
  refreshRate = 0,
): FetchState<PipelineListPaged<PipelineVersionKF>> => {
  const { api } = usePipelinesAPI();

  return usePipelineQuery<PipelineVersionKF>(
    React.useCallback(
      (opts, params) => {
        if (!pipelineId) {
          return Promise.reject(new NotReadyError('No pipeline id'));
        }
        return api
          .listPipelineVersions(opts, pipelineId, params)
          .then((result) => ({ ...result, items: result.pipeline_versions }));
      },
      [api, pipelineId],
    ),
    options,
    refreshRate,
  );
};

export default usePipelineVersionsForPipeline;
