import * as React from 'react';
import { TableVariant } from '@patternfly/react-table';
import {
  TableBase,
  getTableColumnSort,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { PipelineKF, PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { pipelineVersionColumns } from '@odh-dashboard/pipelines/concepts/content/tables/columns';
import PipelineVersionTableRow from '@odh-dashboard/pipelines/concepts/content/tables/pipelineVersion/PipelineVersionTableRow';
import { usePipelineVersionLoadMore } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineLoadMore';
import PipelineViewMoreFooterRow from '@odh-dashboard/pipelines/concepts/content/tables/PipelineViewMoreFooterRow';
import { PipelineAndVersionContext } from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import usePipelineVersionsCheckboxTable from '@odh-dashboard/pipelines/concepts/content/tables/pipelineVersion/usePipelineVersionsCheckboxTable';
import DeletePipelinesModal from '@odh-dashboard/pipelines/concepts/content/DeletePipelinesModal';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

type PipelineVersionTableProps = {
  pipeline: PipelineKF;
  initialVersions: PipelineVersionKF[];
  nextPageToken?: string;
  loading?: boolean;
  totalSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  setSortField: (field: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
};

const PipelineVersionTable: React.FC<PipelineVersionTableProps> = ({
  pipeline,
  initialVersions,
  nextPageToken,
  loading,
  totalSize,
  sortField,
  sortDirection,
  ...tableProps
}) => {
  const pipelineId = pipeline.pipeline_id;
  const [versions, onLoadMore] = usePipelineVersionLoadMore(
    {
      initialData: initialVersions,
      initialPageToken: nextPageToken,
      loaded: !loading,
    },
    pipelineId,
  )({ sortDirection, sortField });
  const { isPipelineChecked } = React.useContext(PipelineAndVersionContext);
  const pipelineChecked = isPipelineChecked(pipelineId);
  const {
    tableProps: checkboxTableProps,
    isSelected,
    toggleSelection,
  } = usePipelineVersionsCheckboxTable(pipeline, versions);
  const { refreshAllAPI } = usePipelinesAPI();

  const [deleteVersions, setDeleteVersions] = React.useState<
    { pipelineName: string; version: PipelineVersionKF }[]
  >([]);

  return (
    <>
      <TableBase
        {...checkboxTableProps}
        loading={loading}
        itemCount={totalSize}
        data={versions}
        columns={pipelineVersionColumns}
        rowRenderer={(version) => (
          <PipelineVersionTableRow
            key={version.pipeline_version_id}
            isChecked={pipelineChecked || isSelected(version)}
            onToggleCheck={() => toggleSelection(version)}
            version={version}
            isDisabled={pipelineChecked}
            pipeline={pipeline}
            onDeleteVersion={() =>
              setDeleteVersions([{ pipelineName: pipeline.display_name, version }])
            }
          />
        )}
        variant={TableVariant.compact}
        borders={false}
        getColumnSort={getTableColumnSort({
          columns: pipelineVersionColumns,
          sortField,
          sortDirection,
          ...tableProps,
        })}
        footerRow={() =>
          !loading ? (
            <PipelineViewMoreFooterRow
              visibleLength={versions.length}
              totalSize={totalSize}
              errorTitle="Error loading more pipeline versions"
              onClick={onLoadMore}
              isIndented
              colSpan={5}
            />
          ) : null
        }
        data-testid="pipeline-versions-table"
      />
      {deleteVersions.length ? (
        <DeletePipelinesModal
          toDeletePipelineVersions={deleteVersions}
          onClose={(deleted) => {
            if (deleted) {
              refreshAllAPI();
            }
            setDeleteVersions([]);
          }}
        />
      ) : null}
    </>
  );
};

export default PipelineVersionTable;
