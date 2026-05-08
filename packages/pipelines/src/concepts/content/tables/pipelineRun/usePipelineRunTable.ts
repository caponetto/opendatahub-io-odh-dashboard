import {
  usePipelineActiveRuns,
  usePipelineArchivedRuns,
} from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRuns';
import { useCreatePipelineRunTable } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineRunOptions } from '@odh-dashboard/pipelines/concepts/types';

export const usePipelineActiveRunsTable = (
  options?: PipelineRunOptions,
  limit?: number,
): ReturnType<typeof useCreatePipelineRunTable<PipelineRunKF>> =>
  useCreatePipelineRunTable<PipelineRunKF>(usePipelineActiveRuns, options, limit);

export const usePipelineArchivedRunsTable = (
  options?: PipelineRunOptions,
  limit?: number,
): ReturnType<typeof useCreatePipelineRunTable<PipelineRunKF>> =>
  useCreatePipelineRunTable<PipelineRunKF>(usePipelineArchivedRuns, options, limit);
