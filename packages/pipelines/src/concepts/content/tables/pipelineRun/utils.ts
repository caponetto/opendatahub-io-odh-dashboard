import { getArtifactModelData } from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/artifacts/utils';
import { PipelineRecurringRunKF, PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { isPipelineRun } from '@odh-dashboard/pipelines/concepts/content/utils';
import { Artifact } from '../../../../third_party/mlmd';

export const ALL_RUNS_METRICS_COLUMNS_STORAGE_KEY = 'all-runs-metrics-columns';

export const getMlflowExperimentNameFromRun = (
  run: PipelineRunKF | PipelineRecurringRunKF,
): string | undefined => {
  const outputName = isPipelineRun(run)
    ? run.plugins_output?.mlflow?.entries.experiment_name?.value
    : undefined;
  const name = outputName ?? run.plugins_input?.mlflow?.experiment_name;
  return typeof name === 'string' ? name.trim() || undefined : undefined;
};

export const filterByMlflowExperiment = <T extends PipelineRunKF | PipelineRecurringRunKF>(
  runs: T[],
  filter: string | undefined,
): T[] => {
  const normalized = filter?.trim().toLowerCase();
  if (!normalized) {
    return runs;
  }
  return runs.filter((run) => {
    const name = getMlflowExperimentNameFromRun(run);
    return !!name && name.toLowerCase() === normalized;
  });
};

export const getMetricsColumnsLocalStorageKey = (experimentId?: string): string =>
  experimentId ? `metrics-columns-${experimentId}` : ALL_RUNS_METRICS_COLUMNS_STORAGE_KEY;

export const isPipelineRunRegistered = (artifact: Artifact[]): boolean => {
  const artifactModelData = artifact.map((a) => getArtifactModelData(a));
  return artifactModelData.some((data) => data.registeredModelName);
};
