import * as React from 'react';
import { Td, Tbody, Tr, ActionsColumn, TableText } from '@patternfly/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import {
  CheckboxTd,
  TableRowTitleDescription,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { pipelineVersionDetailsRoute } from '@odh-dashboard/pipelines/routes/global';
import { createRunRoute, createRecurringRunRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelinesTableExpandedRow from '@odh-dashboard/pipelines/concepts/content/tables/pipeline/PipelinesTableExpandedRow';
import PipelineVersionUploadModal from '@odh-dashboard/pipelines/concepts/content/import/PipelineVersionImportModal';
import PipelinesTableRowTime from '@odh-dashboard/pipelines/concepts/content/tables/PipelinesTableRowTime';
import usePipelineTableRowData from '@odh-dashboard/pipelines/concepts/content/tables/pipeline/usePipelineTableRowData';
import { PipelineAndVersionContext } from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import { isArgoWorkflow } from '@odh-dashboard/pipelines/concepts/content/tables/utils';
import {
  PIPELINE_CREATE_RUN_TOOLTIP_ARGO_ERROR,
  PIPELINE_CREATE_SCHEDULE_TOOLTIP_ARGO_ERROR,
} from '@odh-dashboard/pipelines/concepts/content/const';

const DISABLE_TOOLTIP =
  'All child pipeline versions must be deleted before deleting the parent pipeline';

type PipelinesTableRowProps = {
  pipeline: PipelineKF;
  isChecked: boolean;
  onToggleCheck: () => void;
  rowIndex: number;
  onDeletePipeline: () => void;
  refreshPipelines: () => Promise<unknown>;
  disableCheck: (id: PipelineKF, disabled: boolean) => void;
};

const PipelinesTableRow: React.FC<PipelinesTableRowProps> = ({
  pipeline,
  isChecked,
  onToggleCheck,
  rowIndex,
  onDeletePipeline,
  refreshPipelines,
  disableCheck,
}) => {
  const navigate = useNavigate();
  const { namespace } = usePipelinesAPI();
  const [isExpanded, setExpanded] = React.useState(false);
  const [importTarget, setImportTarget] = React.useState<PipelineKF | null>(null);
  const {
    version,
    totalSize,
    updatedDate,
    loading,
    refresh: refreshRowData,
  } = usePipelineTableRowData(pipeline);
  const { versionDataSelector } = React.useContext(PipelineAndVersionContext);
  const { selectedVersions } = versionDataSelector(pipeline);
  const selectedVersionLength = selectedVersions.length;

  const createdDate = new Date(pipeline.created_at);

  const pipelineRef = React.useRef(pipeline);
  pipelineRef.current = pipeline;

  // disable the checkbox if the pipeline has pipeline versions
  const disableDelete = totalSize > 0;
  const hasNoPipelineVersions = totalSize === 0;
  React.useEffect(() => {
    disableCheck(pipelineRef.current, disableDelete || loading);
  }, [disableDelete, loading, disableCheck]);

  const isCreateDisabled = isArgoWorkflow(version?.pipeline_spec) || hasNoPipelineVersions;

  return (
    <>
      <Tbody isExpanded={isExpanded}>
        <Tr data-testid={`pipeline-row ${pipeline.pipeline_id}`}>
          <Td
            expand={{
              rowIndex,
              expandId: 'pipeline-row-item',
              isExpanded,
              onToggle: () => setExpanded(!isExpanded),
            }}
          />
          <CheckboxTd
            id={pipeline.pipeline_id}
            isChecked={isChecked ? true : selectedVersionLength !== 0 ? null : false}
            onToggle={onToggleCheck}
            isDisabled={disableDelete}
            tooltip={disableDelete ? DISABLE_TOOLTIP : undefined}
          />
          <Td>
            <TableRowTitleDescription
              title={
                loading ? (
                  <Skeleton />
                ) : version?.pipeline_version_id ? (
                  <Link
                    to={pipelineVersionDetailsRoute(
                      namespace,
                      version.pipeline_id,
                      version.pipeline_version_id,
                    )}
                  >
                    <TableText>{pipeline.display_name}</TableText>
                  </Link>
                ) : (
                  <TableText>{pipeline.display_name}</TableText>
                )
              }
              description={pipeline.description}
              descriptionAsMarkdown
            />
          </Td>
          <Td>{loading ? <Skeleton /> : totalSize}</Td>
          <Td>
            <PipelinesTableRowTime date={createdDate} />
          </Td>
          <Td>{loading ? <Skeleton /> : <PipelinesTableRowTime date={updatedDate} />}</Td>
          <Td isActionCell>
            <ActionsColumn
              items={[
                {
                  title: 'Upload new version',
                  onClick: () => {
                    setImportTarget(pipeline);
                  },
                },
                {
                  isSeparator: true,
                },
                {
                  title: 'Create run',
                  onClick: () => {
                    navigate(createRunRoute(namespace), {
                      state: {
                        contextData: {
                          pipeline,
                          version,
                        },
                      },
                    });
                  },
                  isAriaDisabled: isCreateDisabled,
                  tooltipProps: isArgoWorkflow(version?.pipeline_spec)
                    ? { content: PIPELINE_CREATE_RUN_TOOLTIP_ARGO_ERROR }
                    : undefined,
                },
                {
                  title: 'Create schedule',
                  onClick: () => {
                    navigate(createRecurringRunRoute(namespace), {
                      state: {
                        contextData: {
                          pipeline,
                        },
                      },
                    });
                  },
                  isAriaDisabled: isCreateDisabled,
                  tooltipProps: isArgoWorkflow(version?.pipeline_spec)
                    ? { content: PIPELINE_CREATE_SCHEDULE_TOOLTIP_ARGO_ERROR }
                    : undefined,
                },
                {
                  isSeparator: true,
                },
                {
                  title: <span data-testid="delete-pipeline-action">Delete pipeline</span>,
                  isAriaDisabled: disableDelete,
                  tooltipProps: disableDelete
                    ? {
                        content: DISABLE_TOOLTIP,
                      }
                    : undefined,
                  onClick: () => {
                    onDeletePipeline();
                  },
                },
              ]}
            />
          </Td>
        </Tr>
        {isExpanded && (
          <PipelinesTableExpandedRow
            // Upload a new version will update the totalSize (version length)
            // Which will trigger a re-render of the versions table
            key={`${pipeline.pipeline_id}-expanded-${totalSize}`}
            pipeline={pipeline}
          />
        )}
      </Tbody>
      {importTarget && (
        <PipelineVersionUploadModal
          existingPipeline={importTarget}
          onClose={(pipelineVersion) => {
            if (pipelineVersion) {
              refreshPipelines();
              refreshRowData();
            }
            setImportTarget(null);
          }}
        />
      )}
    </>
  );
};

export default PipelinesTableRow;
