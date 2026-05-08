import * as React from 'react';
import { TextInput } from '@patternfly/react-core';
import SimpleSelect, {
  SimpleSelectOption,
} from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
import DashboardDatePicker from '@odh-dashboard/dashboard-foundation-frontend/components/DashboardDatePicker';
import { MlflowExperimentSelector } from '@odh-dashboard/pipelines/concepts/mlflow/useMlflowIntegration';
import PipelineFilterBar from '@odh-dashboard/pipelines/concepts/content/tables/PipelineFilterBar';
import { FilterOptions } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineFilter';
import { RuntimeStateKF, runtimeStateLabels } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineRunVersionsContext } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/PipelineRunVersionsContext';
import { PipelineRunExperimentsContext } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/PipelineRunExperimentsContext';
import {
  ExperimentFilterSelector,
  PipelineVersionFilterSelector,
} from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/CustomPipelineRunToolbarSelect';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

export type FilterProps = Pick<
  React.ComponentProps<typeof PipelineFilterBar>,
  'filterData' | 'onFilterUpdate'
>;

interface PipelineRunTableToolbarBaseProps extends FilterProps {
  actions?: React.ReactNode[];
  filterOptions: React.ComponentProps<typeof PipelineFilterBar>['filterOptions'];
  children?: React.ReactNode;
}

const PipelineRunTableToolbarBase: React.FC<PipelineRunTableToolbarBaseProps> = ({
  actions,
  filterOptions,
  children,
  ...toolbarProps
}) => {
  const { versions } = React.useContext(PipelineRunVersionsContext);
  const { experiments } = React.useContext(PipelineRunExperimentsContext);
  const { namespace } = usePipelinesAPI();
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    [RuntimeStateKF.RUNTIME_STATE_UNSPECIFIED]: unspecifiedState,
    [RuntimeStateKF.PAUSED]: pausedState,
    [RuntimeStateKF.CANCELED]: cancelledState,
    ...statusRuntimeStates
  } = runtimeStateLabels;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <PipelineFilterBar
      {...toolbarProps}
      filterOptions={filterOptions}
      filterOptionRenders={{
        [FilterOptions.NAME]: ({ onChange, ...props }) => (
          <TextInput
            {...props}
            data-testid="search-for-run-name"
            aria-label="Search for a run name"
            placeholder="Search..."
            onChange={(_event, value) => onChange(value)}
          />
        ),
        [FilterOptions.RUN_GROUP]: ({ onChange, label }) => (
          <ExperimentFilterSelector
            resources={experiments}
            selection={label}
            onSelect={(runGroup) => onChange(runGroup.experiment_id, runGroup.display_name)}
          />
        ),
        [FilterOptions.PIPELINE_VERSION]: ({ onChange, label }) => (
          <PipelineVersionFilterSelector
            resources={versions}
            selection={label}
            onSelect={(version) => onChange(version.pipeline_version_id, version.display_name)}
          />
        ),
        [FilterOptions.MLFLOW_EXPERIMENT]: ({ onChange, value }) => (
          <MlflowExperimentSelector
            workspace={namespace}
            selection={value}
            onSelect={(experiment) => onChange(experiment.name)}
          />
        ),
        [FilterOptions.CREATED_AT]: ({ onChange, ...props }) => (
          <DashboardDatePicker
            {...props}
            hideError
            aria-label="Select a start date"
            onChange={(_, value, date) => {
              if (date || !value) {
                onChange(value);
              }
            }}
          />
        ),
        [FilterOptions.STATUS]: ({ value, onChange, ...props }) => (
          <SimpleSelect
            {...props}
            value={value}
            placeholder="Select a status"
            aria-label="Select a status"
            options={Object.values(statusRuntimeStates).map(
              (v): SimpleSelectOption => ({
                key: v,
                label: v,
              }),
            )}
            onChange={(v) => onChange(v)}
            dataTestId="runtime-status-dropdown"
            popperProps={{ maxWidth: undefined, appendTo: 'inline' }}
          />
        ),
      }}
    >
      {actions?.map((action, index) => (
        <React.Fragment key={index}>{action}</React.Fragment>
      ))}
      {children}
    </PipelineFilterBar>
  );
};

export default PipelineRunTableToolbarBase;
