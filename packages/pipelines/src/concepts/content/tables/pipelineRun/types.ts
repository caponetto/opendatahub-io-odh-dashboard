import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { ArtifactProperty } from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/artifacts/types';

export type RunWithMetrics = PipelineRunKF & { metrics: ArtifactProperty[] };
