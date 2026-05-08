import {
  SortableData,
  checkboxTableColumn,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { getFullArtifactPathLabel } from '@odh-dashboard/pipelines/concepts/content/compareRuns/metricsSection/utils';
import { FullArtifactPathsAndConfig } from './types';

export const rocCurveColumns: SortableData<FullArtifactPathsAndConfig>[] = [
  checkboxTableColumn(),
  {
    label: 'Execution name > Artifact name',
    field: 'execution-name-artifact-name',
    sortable: (a, b) =>
      getFullArtifactPathLabel(a.fullArtifactPath).localeCompare(
        getFullArtifactPathLabel(b.fullArtifactPath),
      ),
  },
  {
    label: 'Run name',
    field: 'run-name',
    sortable: false,
  },
  {
    label: 'Curve legend',
    field: 'curve-legend',
    sortable: false,
  },
];
