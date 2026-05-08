import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import {
  MlmdContext,
  MlmdContextTypes,
} from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/types';
import { useMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useMlmdContext';

export const usePipelineRunMlmdContext = (
  runID?: string,
  refreshRate?: number,
): FetchState<MlmdContext | null> => useMlmdContext(runID, MlmdContextTypes.RUN, refreshRate);
