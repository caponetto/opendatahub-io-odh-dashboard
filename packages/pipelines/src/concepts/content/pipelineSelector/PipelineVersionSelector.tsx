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
import { PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { pipelineVersionSelectorColumns } from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/columns';
import PipelineViewMoreFooterRow from '@odh-dashboard/pipelines/concepts/content/tables/PipelineViewMoreFooterRow';
import usePipelineVersionSelector from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/usePipelineVersionSelector';
import { isArgoWorkflow } from '@odh-dashboard/pipelines/concepts/content/tables/utils';

type PipelineVersionSelectorProps = {
  pipelineId?: string;
  selection?: string;
  isCreatePage?: boolean;
  onSelect: (version: PipelineVersionKF) => void;
};

const PipelineVersionSelector: React.FC<PipelineVersionSelectorProps> = ({
  pipelineId,
  selection,
  isCreatePage,
  onSelect,
}) => {
  const {
    fetchedSize,
    totalSize,
    searchProps,
    onSearchClear,
    onLoadMore,
    sortProps,
    loaded,
    initialLoaded,
    data: versions,
  } = usePipelineVersionSelector(pipelineId);

  // Only filter the unsupported version for create page.
  const supportedVersions = React.useMemo(
    () => (isCreatePage ? versions.filter((v) => !isArgoWorkflow(v.pipeline_spec)) : versions),
    [versions, isCreatePage],
  );
  const supportedVersionsSize = supportedVersions.length;

  return (
    <SearchSelector
      dataTestId="pipeline-version-selector"
      onSearchChange={(newValue) => searchProps.onChange(newValue)}
      onSearchClear={() => onSearchClear()}
      searchValue={searchProps.value ?? ''}
      isLoading={!!pipelineId && !initialLoaded}
      isFullWidth
      toggleContent={
        !pipelineId
          ? 'Select a pipeline version'
          : initialLoaded
          ? selection ||
            (totalSize === 0
              ? 'No versions available'
              : supportedVersionsSize === 0
              ? 'No supported versions available'
              : 'Select a pipeline version')
          : 'Loading pipeline versions'
      }
      searchHelpText={`Type a name to search your ${supportedVersionsSize} versions.`}
      isDisabled={totalSize === 0}
    >
      {({ menuClose }) => (
        <TableBase
          itemCount={fetchedSize}
          loading={!loaded}
          data-testid="pipeline-version-selector-table-list"
          emptyTableView={
            <DashboardEmptyTableView
              hasIcon={false}
              onClearFilters={onSearchClear}
              variant={EmptyStateVariant.xs}
            />
          }
          borders={false}
          variant={TableVariant.compact}
          columns={pipelineVersionSelectorColumns}
          data={supportedVersions}
          rowRenderer={(row) => (
            <PipelineSelectorTableRow
              isRowSelected={row.display_name === selection}
              key={row.pipeline_version_id}
              obj={row}
              onClick={() => {
                onSelect(row);
                menuClose();
              }}
            />
          )}
          getColumnSort={getTableColumnSort({
            columns: pipelineVersionSelectorColumns,
            ...sortProps,
          })}
          footerRow={() =>
            loaded ? (
              <PipelineViewMoreFooterRow
                visibleLength={versions.length}
                totalSize={fetchedSize}
                errorTitle="Error loading more pipeline versions"
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

// TODO: refactor the modal across the app, only render it when it's open
// In that way we don't need the wrapper anymore
const PipelineVersionSelectorWrapper = (
  props: PipelineVersionSelectorProps,
): React.ReactElement => <PipelineVersionSelector key={props.pipelineId} {...props} />;

export default PipelineVersionSelectorWrapper;
