import * as React from 'react';
import {
  UseCheckboxTableBaseProps,
  useCheckboxTableBase,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { PipelineAndVersionContext } from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const usePipelinesCheckboxTable = (
  pipelines: PipelineKF[],
): UseCheckboxTableBaseProps<PipelineKF> => {
  const { pipelineDataSelector } = React.useContext(PipelineAndVersionContext);
  const { selectedPipelines, setSelectedPipelines } = pipelineDataSelector();
  return useCheckboxTableBase<PipelineKF>(
    pipelines,
    selectedPipelines,
    setSelectedPipelines,
    React.useCallback((pipeline) => pipeline.pipeline_id, []),
  );
};

export default usePipelinesCheckboxTable;
