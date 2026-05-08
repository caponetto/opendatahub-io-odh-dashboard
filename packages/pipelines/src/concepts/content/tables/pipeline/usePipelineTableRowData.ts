import { FetchStateRefreshPromise } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import usePipelineVersionsForPipeline from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineVersionsForPipeline';
import { PipelineKF, PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineListPaged } from '@odh-dashboard/pipelines/concepts/types';

const usePipelineTableRowData = (
  pipeline: PipelineKF,
): {
  version: PipelineVersionKF | undefined;
  updatedDate: Date;
  totalSize: number;
  loading: boolean;
  refresh: FetchStateRefreshPromise<PipelineListPaged<PipelineVersionKF>>;
} => {
  const [{ items, totalSize }, isLoaded, , refresh] = usePipelineVersionsForPipeline(
    pipeline.pipeline_id,
    {
      pageSize: 1,
      sortField: 'created_at',
      sortDirection: 'desc',
    },
  );
  const latestVersion = isLoaded ? items[0] : undefined;
  const updatedDate = new Date(latestVersion?.created_at || pipeline.created_at);

  return { version: latestVersion, updatedDate, totalSize, loading: !isLoaded, refresh };
};

export default usePipelineTableRowData;
