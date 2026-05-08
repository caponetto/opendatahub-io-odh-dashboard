import * as React from 'react';
import { TextInput, ToolbarItem } from '@patternfly/react-core';
import {
  Table,
  useCheckboxTableBase,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import DashboardEmptyTableView from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardEmptyTableView';
import { getLinkedArtifactId } from '@odh-dashboard/pipelines/concepts/content/compareRuns/metricsSection/utils';
import RocCurveTableRow from './RocCurveTableRow';
import { rocCurveColumns } from './const';
import { FullArtifactPathsAndConfig } from './types';

type RocCurveTableBaseProps = ReturnType<
  typeof useCheckboxTableBase<FullArtifactPathsAndConfig>
> & {
  fullArtifactPaths: FullArtifactPathsAndConfig[];
  setSearch: (search: string) => void;
  isSelected: (id: FullArtifactPathsAndConfig) => boolean;
  toggleSelection: (id: FullArtifactPathsAndConfig) => void;
};

const RocCurveTable: React.FC<RocCurveTableBaseProps> = ({
  fullArtifactPaths,
  setSearch,
  isSelected,
  toggleSelection,
  ...checkboxTableProps
}) => (
  <Table
    {...checkboxTableProps.tableProps}
    data={fullArtifactPaths}
    columns={rocCurveColumns}
    enablePagination="compact"
    emptyTableView={<DashboardEmptyTableView onClearFilters={() => setSearch('')} />}
    toolbarContent={
      <ToolbarItem>
        <TextInput
          data-testid="roc-curve-search"
          aria-label="Search artifact"
          placeholder="Search artifact"
          onChange={(_event, value) => setSearch(value)}
        />
      </ToolbarItem>
    }
    rowRenderer={(fullArtifactPathAndConfig) => (
      <RocCurveTableRow
        key={getLinkedArtifactId(fullArtifactPathAndConfig.fullArtifactPath.linkedArtifact)}
        isChecked={isSelected(fullArtifactPathAndConfig)}
        onToggleCheck={() => toggleSelection(fullArtifactPathAndConfig)}
        fullArtifactPathAndConfig={fullArtifactPathAndConfig}
      />
    )}
    data-testid="roc-curve-filter-table"
    variant="compact"
  />
);
export default RocCurveTable;
