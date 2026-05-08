import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import usePipelineVersionsForPipeline from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineVersionsForPipeline';
import createUsePipelineTable, {
  TableProps,
} from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import { PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineListPaged, PipelineOptions } from '@odh-dashboard/pipelines/concepts/types';

export default (
  pipelineId?: string,
): ((limit?: number) => [FetchState<PipelineListPaged<PipelineVersionKF>>, TableProps]) =>
  createUsePipelineTable((options: PipelineOptions) =>
    usePipelineVersionsForPipeline(pipelineId, options),
  );
