import useExperiments, {
  useActiveExperiments,
} from '@odh-dashboard/pipelines/concepts/apiHooks/useExperiments';
import createUsePipelineTable from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';

export const useActiveExperimentTable = createUsePipelineTable(useActiveExperiments);

export default createUsePipelineTable(useExperiments);
