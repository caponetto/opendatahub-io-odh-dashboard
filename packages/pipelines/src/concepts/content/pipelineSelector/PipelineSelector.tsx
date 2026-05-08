import * as React from 'react';
import { EmptyStateVariant } from '@patternfly/react-core';
import { TableVariant } from '@patternfly/react-table';
import {
  TableBase,
  getTableColumnSort,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import DashboardEmptyTableView from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardEmptyTableView';
import SearchSelector from '@odh-dashboard/dashboard-foundation-frontend/components/searchSelector/SearchSelector';
import PipelineSelectorTableRow from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/PipelineSelectorTableRow';
import { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { pipelineSelectorColumns } from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/columns';
import PipelineViewMoreFooterRow from '@odh-dashboard/pipelines/concepts/content/tables/PipelineViewMoreFooterRow';
import { usePipelineSelector } from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/useCreateSelectors';

type PipelineSelectorProps = {
  selection?: string;
  onSelect: (pipeline: PipelineKF) => void;
};

const PipelineSelector: React.FC<PipelineSelectorProps> = ({ selection, onSelect }) => {
  const {
    fetchedSize,
    totalSize,
    searchProps,
    onSearchClear,
    onLoadMore,
    sortProps,
    loaded,
    initialLoaded,
    data: pipelines,
  } = usePipelineSelector();

  return (
    <SearchSelector
      dataTestId="pipeline-selector"
      onSearchChange={(newValue) => searchProps.onChange(newValue)}
      onSearchClear={() => onSearchClear()}
      searchValue={searchProps.value ?? ''}
      isLoading={!initialLoaded}
      isFullWidth
      toggleContent={
        initialLoaded
          ? selection || (totalSize === 0 ? 'No pipelines available' : 'Select a pipeline')
          : 'Loading pipelines'
      }
      searchHelpText={`Type a name to search your ${totalSize} pipelines.`}
      isDisabled={totalSize === 0}
    >
      {({ menuClose }) => (
        <TableBase
          itemCount={fetchedSize}
          loading={!loaded}
          data-testid="pipeline-selector-table-list"
          emptyTableView={
            <DashboardEmptyTableView
              hasIcon={false}
              onClearFilters={onSearchClear}
              variant={EmptyStateVariant.xs}
            />
          }
          borders={false}
          variant={TableVariant.compact}
          columns={pipelineSelectorColumns}
          data={pipelines}
          rowRenderer={(row) => (
            <PipelineSelectorTableRow
              key={row.pipeline_id}
              obj={row}
              onClick={() => {
                onSelect(row);
                menuClose();
              }}
            />
          )}
          getColumnSort={getTableColumnSort({
            columns: pipelineSelectorColumns,
            ...sortProps,
          })}
          footerRow={() =>
            loaded ? (
              <PipelineViewMoreFooterRow
                visibleLength={pipelines.length}
                totalSize={fetchedSize}
                errorTitle="Error loading more pipelines"
                onClick={onLoadMore}
                colSpan={2}
              />
            ) : null
          }
        />
      )}
    </SearchSelector>
  );
};

export default PipelineSelector;
