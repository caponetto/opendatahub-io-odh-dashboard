import * as React from 'react';
import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { K8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  ExperimentKF,
  PipelinesFilterOp,
  StorageStateKF,
} from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineQuery from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineQuery';
import {
  ListExperiments,
  PipelineListPaged,
  PipelineOptions,
  PipelineParams,
} from '@odh-dashboard/pipelines/concepts/types';

const useExperimentsByStorageState = (
  options?: PipelineOptions,
  storageState?: StorageStateKF,
): FetchState<PipelineListPaged<ExperimentKF>> => {
  const { api } = usePipelinesAPI();
  return usePipelineQuery<ExperimentKF>(
    React.useCallback(
      (opts, params) => {
        const predicates = params?.filter?.predicates || [];
        if (storageState) {
          predicates.push({
            key: 'storage_state',
            operation: PipelinesFilterOp.EQUALS,
            // eslint-disable-next-line camelcase
            string_value: storageState,
          });
        }
        return api
          .listExperiments(opts, {
            ...params,
            filter: { predicates },
          })
          .then((result) => ({ ...result, items: result.experiments }));
      },
      [api, storageState],
    ),
    options,
  );
};

const useExperiments = (options?: PipelineOptions): FetchState<PipelineListPaged<ExperimentKF>> =>
  useExperimentsByStorageState(options);

export const useActiveExperiments = (
  options?: PipelineOptions,
): FetchState<PipelineListPaged<ExperimentKF>> => {
  const { api } = usePipelinesAPI();
  return usePipelineQuery<ExperimentKF>(
    React.useCallback(
      (opts, params) =>
        api
          .listActiveExperiments(opts, params)
          .then((result) => ({ ...result, items: result.experiments })),
      [api],
    ),
    options,
  );
};

export const useArchivedExperiments = (
  options?: PipelineOptions,
): FetchState<PipelineListPaged<ExperimentKF>> =>
  useExperimentsByStorageState(options, StorageStateKF.ARCHIVED);

async function getAllExperiments(
  opts: K8sAPIOptions,
  params: PipelineParams | undefined,
  listExperiments: ListExperiments,
): Promise<ExperimentKF[]> {
  const result = await listExperiments(opts, params);
  let allExperiments = result.experiments ?? [];

  if (result.next_page_token) {
    const nextExperiments = await getAllExperiments(
      opts,
      { ...params, pageToken: result.next_page_token },
      listExperiments,
    );
    allExperiments = allExperiments.concat(nextExperiments);
  }

  return allExperiments;
}

export const useAllExperiments = (
  options?: PipelineOptions,
  refreshRate?: number,
): FetchState<PipelineListPaged<ExperimentKF>> => {
  const { api } = usePipelinesAPI();

  return usePipelineQuery<ExperimentKF>(
    React.useCallback(
      async (opts, params) => {
        const experiments = await getAllExperiments(opts, params, api.listExperiments);

        return { items: experiments };
      },
      [api.listExperiments],
    ),
    options,
    refreshRate,
  );
};

export default useExperiments;
