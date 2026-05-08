import * as React from 'react';
import {
  BreadcrumbItem,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  Bullseye,
  Spinner,
  Truncate,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import MarkdownView from '@odh-dashboard/dashboard-foundation-frontend/components/MarkdownView';
import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import PipelineRunDetailsActions from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/PipelineRunDetailsActions';
import PipelineRunDrawerRightContent from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/PipelineRunDrawerRightContent';
import { ArchiveRunModal } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/ArchiveRunModal';
import DeletePipelineRunsModal from '@odh-dashboard/pipelines/concepts/content/DeletePipelineRunsModal';
import PipelineDetailsTitle from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/PipelineDetailsTitle';
import usePipelineVersionById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineVersionById';
import { usePipelineTaskTopology } from '@odh-dashboard/pipelines/concepts/topology';
import { PipelineRunType } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';
import PipelineRecurringRunReferenceName from '@odh-dashboard/pipelines/concepts/content/PipelineRecurringRunReferenceName';
import useExecutionsForPipelineRun from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/useExecutionsForPipelineRun';
import { useGetEventsByExecutionIds } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useGetEventsByExecutionId';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import PipelineNotSupported from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipeline/PipelineNotSupported';
import { isArgoWorkflow } from '@odh-dashboard/pipelines/concepts/content/tables/utils';
import { isPipelineRunRegistered } from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/utils';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import { usePipelineRunArtifacts } from './artifacts';
import { PipelineRunDetailsTabs } from './PipelineRunDetailsTabs';
import PipelineTopology from '../../../topology/PipelineTopology';

const PipelineRunDetails: React.FC<
  PathProps & {
    fetchedRun: FetchState<PipelineRunKF | null>;
  }
> = ({ fetchedRun, breadcrumbPath, contextPath }) => {
  const navigate = useNavigate();
  const [run, runLoaded, runError] = fetchedRun;
  const [version, versionLoaded, versionError] = usePipelineVersionById(
    run?.pipeline_version_reference?.pipeline_id,
    run?.pipeline_version_reference?.pipeline_version_id,
  );
  const pipelineSpec = version?.pipeline_spec ?? run?.pipeline_spec;
  const [deleting, setDeleting] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[] | undefined>();

  const [executions, executionsLoaded, executionsError] = useExecutionsForPipelineRun(run);
  const [artifacts] = usePipelineRunArtifacts(run);
  const [events] = useGetEventsByExecutionIds(
    React.useMemo(() => executions.map((execution) => execution.getId()), [executions]),
  );
  const nodes = usePipelineTaskTopology(
    pipelineSpec,
    run?.run_details,
    executions,
    events,
    artifacts,
  );
  const isInvalidPipelineVersion = isArgoWorkflow(version?.pipeline_spec);
  const { status: modelRegistryAvailable } = useIsAreaAvailable(SupportedArea.MODEL_REGISTRY);
  const isRegistered = modelRegistryAvailable ? isPipelineRunRegistered(artifacts) : false;

  const selectedNode = React.useMemo(() => {
    if (isInvalidPipelineVersion) {
      return null;
    }
    return selectedIds ? nodes.find((n) => n.id === selectedIds[0]) : undefined;
  }, [isInvalidPipelineVersion, selectedIds, nodes]);

  const loaded = runLoaded && (versionLoaded || !!run?.pipeline_spec || !!versionError);
  const error = runError;

  if (error) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={ExclamationCircleIcon}
        titleText="Error loading pipeline run details"
        variant={EmptyStateVariant.lg}
        data-id="error-empty-state"
      >
        <EmptyStateBody>{error.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!loaded || (!executionsLoaded && !executionsError)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const panelContent = selectedNode ? (
    <PipelineRunDrawerRightContent
      task={selectedNode.data.pipelineTask}
      upstreamTaskName={selectedNode.runAfterTasks?.[0]}
      onClose={() => setSelectedIds(undefined)}
      executions={executions}
    />
  ) : null;

  return (
    <>
      <ApplicationsPage
        title={
          run ? (
            <PipelineDetailsTitle
              run={run}
              statusIcon
              pipelineRunLabel
              isRegistered={isRegistered}
            />
          ) : (
            'Error loading run'
          )
        }
        subtext={
          run && (
            <PipelineRecurringRunReferenceName
              runName={run.display_name}
              recurringRunId={run.recurring_run_id}
            />
          )
        }
        description={
          run?.description ? <MarkdownView conciseDisplay markdown={run.description} /> : ''
        }
        loaded={loaded}
        breadcrumb={
          <PipelineContextBreadcrumb>
            {breadcrumbPath}
            <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
              <Truncate content={run?.display_name ?? 'Loading...'} />
            </BreadcrumbItem>
          </PipelineContextBreadcrumb>
        }
        headerAction={
          <PipelineRunDetailsActions
            run={run}
            onDelete={() => setDeleting(true)}
            onArchive={() => setArchiving(true)}
            isPipelineSupported={!isInvalidPipelineVersion}
          />
        }
        empty={false}
      >
        {isInvalidPipelineVersion ? (
          <PipelineNotSupported />
        ) : (
          <PipelineRunDetailsTabs
            run={run}
            versionError={versionError}
            pipelineSpec={pipelineSpec}
            graphContent={
              <PipelineTopology
                nodes={nodes}
                versionError={versionError}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                sidePanel={panelContent}
              />
            }
            artifacts={artifacts}
          />
        )}
      </ApplicationsPage>
      <DeletePipelineRunsModal
        type={PipelineRunType.ARCHIVED}
        toDeleteResources={deleting && run ? [run] : []}
        onClose={(deleteComplete) => {
          fireFormTrackingEvent('Pipeline Run Deleted', {
            outcome: TrackingOutcome.submit,
            success: true,
          });
          if (deleteComplete) {
            navigate(contextPath);
          } else {
            setDeleting(false);
          }
        }}
      />
      {archiving ? (
        <ArchiveRunModal runs={run ? [run] : []} onCancel={() => setArchiving(false)} />
      ) : null}
    </>
  );
};

export default PipelineRunDetails;
