import { FAST_POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { useArtifactsFromMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useArtifactsFromMlmdContext';
import { usePipelineRunMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/usePipelineRunMlmdContext';
import { isPipelineRunFinished } from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRunById';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { Artifact } from '../../../../../third_party/mlmd';

export const usePipelineRunArtifacts = (
  run: PipelineRunKF | null,
): [artifacts: Artifact[], loaded: boolean, error?: Error] => {
  const isFinished = isPipelineRunFinished(run);
  const refreshRate = isFinished ? 0 : FAST_POLL_INTERVAL;
  const [context, , contextError] = usePipelineRunMlmdContext(run?.run_id, refreshRate);
  const [artifacts, artifactsLoaded] = useArtifactsFromMlmdContext(context, refreshRate);

  return [artifacts, artifactsLoaded, contextError];
};
