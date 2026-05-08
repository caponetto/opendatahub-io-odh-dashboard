import * as React from 'react';
import { Button, ExpandableSection } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { TableVariant } from '@patternfly/react-table';
import { Table } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import DashboardEmptyTableView from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardEmptyTableView';
import useIsMlflowPipelinesAvailable from '@odh-dashboard/pipelines/concepts/mlflow/useIsMlflowPipelinesAvailable';
import { useMlflowExperiments } from '@odh-dashboard/pipelines/concepts/mlflow/useMlflowIntegration';
import { manageCompareRunsRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PipelinesFilter } from '@odh-dashboard/pipelines/concepts/types';
import usePipelineFilter, {
  FilterOptions,
  getDataValue,
} from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineFilter';
import { useCompareRuns } from '@odh-dashboard/pipelines/concepts/content/compareRuns/CompareRunsContext';
import useCompareRunsCheckboxTable from '@odh-dashboard/pipelines/concepts/content/compareRuns/useCompareRunsCheckboxTable';
import PipelineRunTableRow from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/PipelineRunTableRow';
import { compareRunColumns } from '@odh-dashboard/pipelines/concepts/content/tables/columns';
import { getMlflowExperimentNameFromRun } from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/utils';
import PipelineRunTableToolbar from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/PipelineRunTableToolbar';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const CompareRunsRunList: React.FC = () => {
  const { namespace } = usePipelinesAPI();
  const { experiment } = React.useContext(ExperimentContext);
  const { available: isMlflowAvailable } = useIsMlflowPipelinesAvailable();
  const { runs, loaded } = useCompareRuns();
  const { data: mlflowExperiments, loaded: mlflowExperimentsLoaded } = useMlflowExperiments({
    workspace: isMlflowAvailable ? namespace : '',
  });
  const [isExpanded, setExpanded] = React.useState(true);
  const [, setFilter] = React.useState<PipelinesFilter | undefined>();
  const { onClearFilters, ...filterToolbarProps } = usePipelineFilter(setFilter);
  const { filterData } = filterToolbarProps;
  const {
    tableProps: checkboxTableProps,
    toggleSelection,
    isSelected,
  } = useCompareRunsCheckboxTable();

  const filteredRuns = React.useMemo(() => {
    const runName = getDataValue(filterData[FilterOptions.NAME])?.toLowerCase();
    const startedTime = getDataValue(filterData[FilterOptions.CREATED_AT]);
    const startedDate = startedTime && new Date(startedTime);
    const state = getDataValue(filterData[FilterOptions.STATUS])?.toLowerCase();
    const runGroupFilter = getDataValue(filterData[FilterOptions.RUN_GROUP]);
    const pipelineVersionId = getDataValue(filterData[FilterOptions.PIPELINE_VERSION]);
    const mlflowExperimentFilter = isMlflowAvailable
      ? getDataValue(filterData[FilterOptions.MLFLOW_EXPERIMENT])?.toLowerCase()
      : undefined;

    return runs.filter((run) => {
      const nameMatch = !runName || run.display_name.toLowerCase().includes(runName);
      const dateTimeMatch = !startedDate || new Date(run.created_at) >= startedDate;
      const stateMatch = !state || run.state.toLowerCase() === state;
      const runGroupIdMatch = !runGroupFilter || run.experiment_id === runGroupFilter;
      const pipelineVersionIdMatch =
        !pipelineVersionId ||
        run.pipeline_version_reference?.pipeline_version_id === pipelineVersionId;
      const mlflowExperimentName = getMlflowExperimentNameFromRun(run);
      const mlflowExperimentMatch =
        !mlflowExperimentFilter ||
        (!!mlflowExperimentName && mlflowExperimentName.toLowerCase() === mlflowExperimentFilter);

      return (
        nameMatch &&
        dateTimeMatch &&
        stateMatch &&
        runGroupIdMatch &&
        pipelineVersionIdMatch &&
        mlflowExperimentMatch
      );
    });
  }, [runs, filterData, isMlflowAvailable]);

  const manageRunsHref = manageCompareRunsRoute(
    namespace,
    runs.map((r) => r.run_id),
    experiment?.experiment_id,
  );
  const { onFilterUpdate } = filterToolbarProps;
  const handleRunGroupClick = React.useCallback(
    (clickedExperiment: ExperimentKF) => {
      onFilterUpdate(FilterOptions.RUN_GROUP, {
        value: clickedExperiment.experiment_id,
        label: clickedExperiment.display_name,
      });
    },
    [onFilterUpdate],
  );

  return (
    <ExpandableSection
      toggleText="Run list"
      isExpanded={isExpanded}
      onToggle={(_, expanded) => setExpanded(expanded)}
      isIndented
    >
      <Table
        {...checkboxTableProps}
        defaultSortColumn={1}
        loading={!loaded}
        data={filteredRuns}
        columns={compareRunColumns(isMlflowAvailable).filter(
          (column) => !experiment || column.field !== 'run_group',
        )}
        enablePagination="compact"
        emptyTableView={<DashboardEmptyTableView onClearFilters={onClearFilters} />}
        toolbarContent={
          <PipelineRunTableToolbar
            data-testid="compare-runs-table-toolbar"
            actions={[
              <Button
                key="manage-runs-button"
                variant="primary"
                component={(props: React.ComponentProps<'a'>) => (
                  <Link {...props} to={manageRunsHref} />
                )}
              >
                Manage runs
              </Button>,
            ]}
            {...filterToolbarProps}
          />
        }
        rowRenderer={(run) => (
          <PipelineRunTableRow
            key={run.run_id}
            checkboxProps={{
              isChecked: isSelected(run),
              onToggle: () => toggleSelection(run),
            }}
            mlflow={{
              isAvailable: isMlflowAvailable,
              experiments: mlflowExperiments,
              loaded: mlflowExperimentsLoaded,
            }}
            hasRowActions={false}
            onRunGroupClick={handleRunGroupClick}
            run={run}
          />
        )}
        variant={TableVariant.compact}
        data-testid="compare-runs-table"
        id="compare-runs-table"
      />
    </ExpandableSection>
  );
};

export default CompareRunsRunList;
