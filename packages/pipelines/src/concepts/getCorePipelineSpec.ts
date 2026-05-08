import { PipelineSpec, PipelineSpecVariable } from '@odh-dashboard/pipelines/concepts/kfTypes';

export const getCorePipelineSpec = (spec?: PipelineSpecVariable): PipelineSpec | undefined =>
  spec?.pipeline_spec ?? spec;
