import * as React from 'react';
import {
  useCheckboxTableBase,
  UseCheckboxTableBaseProps,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { useCompareRuns } from '@odh-dashboard/pipelines/concepts/content/compareRuns/CompareRunsContext';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const useCompareRunsCheckboxTable = (): UseCheckboxTableBaseProps<PipelineRunKF> => {
  const { selectedRuns, setSelectedRuns, runs } = useCompareRuns();
  return useCheckboxTableBase<PipelineRunKF>(
    runs,
    selectedRuns,
    setSelectedRuns,
    React.useCallback((d) => d.run_id, []),
  );
};

export default useCompareRunsCheckboxTable;
