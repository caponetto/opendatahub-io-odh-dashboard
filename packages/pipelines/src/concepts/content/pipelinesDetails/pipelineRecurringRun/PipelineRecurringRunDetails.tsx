import * as React from 'react';
import {
  BreadcrumbItem,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { useNavigate, useParams } from 'react-router-dom';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import MarkdownView from '@odh-dashboard/dashboard-foundation-frontend/components/MarkdownView';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import { usePipelineTaskTopology } from '@odh-dashboard/pipelines/concepts/topology';
import { PipelineCoreDetailsPageComponent } from '@odh-dashboard/pipelines/concepts/content/types';
import DeletePipelineRunsModal from '@odh-dashboard/pipelines/concepts/content/DeletePipelineRunsModal';
import usePipelineVersionById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineVersionById';
import { PipelineRunType } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';
import SelectedTaskDrawerContent from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipeline/SelectedTaskDrawerContent';
import { PipelineRunDetailsTabs } from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/PipelineRunDetailsTabs';
import usePipelineRecurringRunById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRecurringRunById';
import PipelineNotSupported from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipeline/PipelineNotSupported';
import { isArgoWorkflow } from '@odh-dashboard/pipelines/concepts/content/tables/utils';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import PipelineRecurringRunDetailsActions from './PipelineRecurringRunDetailsActions';
import PipelineTopology from '../../../topology/PipelineTopology';

const PipelineRecurringRunDetails: PipelineCoreDetailsPageComponent = ({
  breadcrumbPath,
  contextPath,
}) => {
  const { recurringRunId } = useParams();
  const navigate = useNavigate();
  const [recurringRun, recurringRunLoaded, recurringRunError] =
    usePipelineRecurringRunById(recurringRunId);
  const [version, versionLoaded, versionError] = usePipelineVersionById(
    recurringRun?.pipeline_version_reference.pipeline_id,
    recurringRun?.pipeline_version_reference.pipeline_version_id,
  );
  const [deleting, setDeleting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>();

  const nodes = usePipelineTaskTopology(version?.pipeline_spec);
  const isInvalidPipelineVersion = isArgoWorkflow(version?.pipeline_spec);

  const selectedNode = React.useMemo(() => {
    if (isInvalidPipelineVersion) {
      return null;
    }
    return selectedIds ? nodes.find((n) => n.id === selectedIds[0]) : undefined;
  }, [isInvalidPipelineVersion, selectedIds, nodes]);

  const loaded = versionLoaded && recurringRunLoaded;
  const error = versionError || recurringRunError;

  if (!loaded && !error) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <EmptyState
        titleText={
          <Title headingLevel="h4" size="lg">
            Error loading pipeline schedule details
          </Title>
        }
        icon={ExclamationCircleIcon}
        variant={EmptyStateVariant.lg}
        data-id="error-empty-state"
      >
        <EmptyStateBody>{error.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  const panelContent = selectedNode ? (
    <SelectedTaskDrawerContent
      task={selectedNode.data.pipelineTask}
      onClose={() => setSelectedIds(undefined)}
    />
  ) : null;

  return (
    <>
      <ApplicationsPage
        title={recurringRun?.display_name}
        description={
          recurringRun ? <MarkdownView conciseDisplay markdown={recurringRun.description} /> : ''
        }
        loaded={loaded}
        loadError={error}
        breadcrumb={
          <PipelineContextBreadcrumb>
            {breadcrumbPath}
            <BreadcrumbItem isActive>{recurringRun?.display_name ?? 'Loading...'}</BreadcrumbItem>
          </PipelineContextBreadcrumb>
        }
        headerAction={
          loaded && (
            <PipelineRecurringRunDetailsActions
              recurringRun={recurringRun ?? undefined}
              onDelete={() => setDeleting(true)}
              isPipelineSupported={!isArgoWorkflow(version?.pipeline_spec)}
            />
          )
        }
        empty={false}
      >
        {isInvalidPipelineVersion ? (
          <PipelineNotSupported />
        ) : (
          <PipelineRunDetailsTabs
            run={recurringRun}
            pipelineSpec={version?.pipeline_spec}
            graphContent={
              <PipelineTopology
                nodes={nodes}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                sidePanel={panelContent}
              />
            }
          />
        )}
      </ApplicationsPage>
      <DeletePipelineRunsModal
        type={PipelineRunType.SCHEDULED}
        toDeleteResources={deleting && recurringRun ? [recurringRun] : []}
        onClose={(deleteComplete) => {
          fireFormTrackingEvent('Pipeline Schedule Deleted', {
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
    </>
  );
};

export default PipelineRecurringRunDetails;
