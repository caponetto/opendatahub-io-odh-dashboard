import { FAST_POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { useExecutionsFromMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useExecutionsFromMlmdContext';
import { usePipelineRunMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/usePipelineRunMlmdContext';
import { isPipelineRunFinished } from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRunById';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { Execution } from '../../../../third_party/mlmd';

const useExecutionsForPipelineRun = (
  run: PipelineRunKF | null,
): [executions: Execution[], loaded: boolean, error?: Error] => {
  const isFinished = isPipelineRunFinished(run);
  const refreshRate = isFinished ? 0 : FAST_POLL_INTERVAL;
  // contextError means mlmd service is not available, no need to check executions
  const [context, , contextError] = usePipelineRunMlmdContext(run?.run_id, refreshRate);
  // executionsLoaded is the flag to show the spinner or not
  const [executions, executionsLoaded] = useExecutionsFromMlmdContext(context, refreshRate);

  return [executions, executionsLoaded, contextError];
};

export default useExecutionsForPipelineRun;
