import * as React from 'react';
import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineQuery from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineQuery';
import { PipelineListPaged, PipelineRunOptions } from '@odh-dashboard/pipelines/concepts/types';

export const usePipelineActiveRuns = (
  options?: PipelineRunOptions,
): FetchState<PipelineListPaged<PipelineRunKF>> => {
  const { api } = usePipelinesAPI();
  const experimentId = options?.experimentId;

  return usePipelineQuery<PipelineRunKF>(
    React.useCallback(
      (opts, params) =>
        api
          .listPipelineActiveRuns(opts, {
            ...params,
            ...(experimentId && { experimentId }),
          })
          .then((result) => ({ ...result, items: result.runs })),
      [api, experimentId],
    ),
    options,
  );
};

export const usePipelineArchivedRuns = (
  options?: PipelineRunOptions,
): FetchState<PipelineListPaged<PipelineRunKF>> => {
  const { api } = usePipelinesAPI();
  const experimentId = options?.experimentId;

  return usePipelineQuery<PipelineRunKF>(
    React.useCallback(
      (opts, params) =>
        api
          .listPipelineArchivedRuns(opts, {
            ...params,
            ...(experimentId && { experimentId }),
          })
          .then((result) => ({ ...result, items: result.runs })),
      [api, experimentId],
    ),
    options,
  );
};

export const usePipelineRunsByExperiment = (
  experimentId: string,
  options?: PipelineRunOptions,
): FetchState<PipelineListPaged<PipelineRunKF>> => {
  const { api } = usePipelinesAPI();

  return usePipelineQuery<PipelineRunKF>(
    React.useCallback(
      (opts, params) =>
        api
          // eslint-disable-next-line camelcase
          .listPipelineRuns(opts, { ...params, experimentId })
          .then((result) => ({ ...result, items: result.runs })),
      [api, experimentId],
    ),
    options,
  );
};
