import * as React from 'react';
import { ToolbarItem } from '@patternfly/react-core';
import useIsMlflowPipelinesAvailable from '@odh-dashboard/pipelines/concepts/mlflow/useIsMlflowPipelinesAvailable';
import { FilterOptions } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineFilter';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import PipelineRunTableToolbarBase, { FilterProps } from './PipelineRunTableToolbarBase';

interface PipelineRunTableToolbarProps extends FilterProps {
  actions?: React.ReactNode[];
  filterOptions?: React.ComponentProps<typeof PipelineRunTableToolbarBase>['filterOptions'];
}

const PipelineRunTableToolbar: React.FC<PipelineRunTableToolbarProps> = ({
  actions,
  filterOptions,
  ...toolbarProps
}) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { available: isMlflowAvailable } = useIsMlflowPipelinesAvailable();

  const defaultFilterOptions = React.useMemo(
    () => ({
      [FilterOptions.NAME]: 'Run',
      ...(!experiment && {
        [FilterOptions.RUN_GROUP]: 'Run group',
      }),
      [FilterOptions.PIPELINE_VERSION]: 'Pipeline version',
      ...(isMlflowAvailable && {
        [FilterOptions.MLFLOW_EXPERIMENT]: 'MLflow experiment',
      }),
      [FilterOptions.CREATED_AT]: 'Created after',
      [FilterOptions.STATUS]: 'Status',
    }),
    [experiment, isMlflowAvailable],
  );

  return (
    <PipelineRunTableToolbarBase
      {...toolbarProps}
      filterOptions={filterOptions || defaultFilterOptions}
      actions={actions?.map((action, index) => (
        <ToolbarItem key={index}>{action}</ToolbarItem>
      ))}
    />
  );
};

export default PipelineRunTableToolbar;
