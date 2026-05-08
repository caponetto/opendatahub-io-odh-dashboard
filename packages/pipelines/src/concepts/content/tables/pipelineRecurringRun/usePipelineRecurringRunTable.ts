import usePipelineRecurringRuns from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRecurringRuns';
import { useCreatePipelineRunTable } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import { PipelineRecurringRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineRunOptions } from '@odh-dashboard/pipelines/concepts/types';

export const usePipelineRecurringRunsTable = (
  options?: PipelineRunOptions,
  limit?: number,
): ReturnType<typeof useCreatePipelineRunTable<PipelineRecurringRunKF>> =>
  useCreatePipelineRunTable<PipelineRecurringRunKF>(usePipelineRecurringRuns, options, limit);
