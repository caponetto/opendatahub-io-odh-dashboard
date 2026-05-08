import * as React from 'react';
import { EmptyStateVariant, Button, Divider } from '@patternfly/react-core';
import { TableVariant } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';
import {
  TableBase,
  getTableColumnSort,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import DashboardEmptyTableView from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardEmptyTableView';
import SearchSelector from '@odh-dashboard/dashboard-foundation-frontend/components/searchSelector/SearchSelector';
import PipelineSelectorTableRow from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/PipelineSelectorTableRow';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import PipelineViewMoreFooterRow from '@odh-dashboard/pipelines/concepts/content/tables/PipelineViewMoreFooterRow';
import { useActiveExperimentSelector } from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/useCreateSelectors';
import { experimentSelectorColumns } from '@odh-dashboard/pipelines/concepts/content/experiment/columns';
import CreateExperimentModal from '@odh-dashboard/pipelines/concepts/content/experiment/CreateExperimentModal';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

type ExperimentSelectorProps = {
  selection?: string;
  onSelect: (experiment: ExperimentKF) => void;
  dataTestId?: string;
};

const InnerExperimentSelector: React.FC<
  ReturnType<typeof useActiveExperimentSelector> & ExperimentSelectorProps
> = ({
  fetchedSize,
  totalSize,
  searchProps,
  onSearchClear,
  onLoadMore,
  sortProps,
  loaded,
  initialLoaded,
  data: experiments,
  selection,
  onSelect,
  dataTestId = 'experiment-selector',
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { refreshAllAPI } = usePipelinesAPI();

  return (
    <>
      <SearchSelector
        dataTestId={dataTestId}
        onSearchChange={(newValue) => searchProps.onChange(newValue)}
        onSearchClear={() => onSearchClear()}
        searchValue={searchProps.value ?? ''}
        isLoading={!initialLoaded}
        isFullWidth
        toggleContent={
          initialLoaded
            ? selection || (totalSize === 0 ? 'No run groups available' : 'Select a run group')
            : 'Loading run groups'
        }
        searchHelpText={`Type a name to search your ${totalSize} run groups.`}
        isDisabled={totalSize === 0}
      >
        {({ menuClose }) => (
          <>
            <div className="pf-v6-c-menu__content">
              <TableBase
                itemCount={fetchedSize}
                loading={!loaded}
                emptyTableView={
                  <DashboardEmptyTableView
                    hasIcon={false}
                    onClearFilters={onSearchClear}
                    variant={EmptyStateVariant.xs}
                  />
                }
                data-testid={`${dataTestId}-table-list`}
                borders={false}
                variant={TableVariant.compact}
                columns={experimentSelectorColumns}
                data={experiments}
                rowRenderer={(row) => (
                  <PipelineSelectorTableRow
                    key={row.experiment_id}
                    obj={row}
                    onClick={() => {
                      onSelect(row);
                      menuClose();
                    }}
                  />
                )}
                getColumnSort={getTableColumnSort({
                  columns: experimentSelectorColumns,
                  ...sortProps,
                })}
                footerRow={() =>
                  loaded ? (
                    <PipelineViewMoreFooterRow
                      visibleLength={experiments.length}
                      totalSize={fetchedSize}
                      errorTitle="Error loading more run groups"
                      onClick={onLoadMore}
                      colSpan={2}
                    />
                  ) : null
                }
              />
            </div>
            {loaded && (
              <div
                className="pf-v6-c-menu__footer pf-v6-u-box-shadow-sm-top"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: 'var(--pf-v6-c-menu--BackgroundColor)',
                }}
              >
                <Divider />
                <Button
                  variant="link"
                  icon={<PlusCircleIcon />}
                  onClick={() => {
                    menuClose();
                    setIsModalOpen(true);
                  }}
                  style={{ paddingLeft: '20px' }}
                >
                  Create new run group
                </Button>
              </div>
            )}
          </>
        )}
      </SearchSelector>
      {isModalOpen && (
        <CreateExperimentModal
          existingNames={experiments.map((e) => e.display_name)}
          onClose={(experiment) => {
            setIsModalOpen(false);
            if (experiment) {
              refreshAllAPI();
              onSelect(experiment);
            }
          }}
        />
      )}
    </>
  );
};

export const ActiveExperimentSelector: React.FC<ExperimentSelectorProps> = (props) => {
  const selectorProps = useActiveExperimentSelector();
  return <InnerExperimentSelector {...props} {...selectorProps} />;
};
