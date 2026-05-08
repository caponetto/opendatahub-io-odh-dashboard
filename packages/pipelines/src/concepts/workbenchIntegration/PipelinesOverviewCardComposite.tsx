import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  CardBody,
  CardFooter,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Spinner,
  Stack,
  Content,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import {
  ProjectObjectType,
  SectionType,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import OverviewCard from '@odh-dashboard/dashboard-foundation-frontend/components/OverviewCard';
import ErrorOverviewCard from '@odh-dashboard/dashboard-foundation-frontend/components/ErrorOverviewCard';
import MetricsContents from '@odh-dashboard/hardware-profiles-shared/components/MetricsContents';
import {
  CreatePipelineServerButton,
  usePipelinesAPI,
} from '@odh-dashboard/pipelines/concepts/context';
import usePipelines, {
  useSafePipelines,
} from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelines';
import {
  usePipelineActiveRuns,
  usePipelineArchivedRuns,
} from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRuns';
import useExperiments from '@odh-dashboard/pipelines/concepts/apiHooks/useExperiments';
import usePipelineRecurringRuns from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRecurringRuns';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import ImportPipelineButton from '@odh-dashboard/pipelines/concepts/content/import/ImportPipelineButton';
import PipelineAndVersionContextProvider from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import type { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const PipelineCardItems: React.FC<{
  pipelines: PipelineKF[];
  loaded?: boolean;
  error?: Error;
  totalCount?: number;
  currentProject: ProjectKind;
}> = ({ pipelines, loaded, error, totalCount = 0, currentProject }) => {
  if (!loaded || error) {
    return null;
  }

  const listItems = pipelines.slice(0, 5);
  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
      {listItems.map((pipeline) => (
        <div key={pipeline.pipeline_id}>{pipeline.display_name}</div>
      ))}
      <Flex key="count" gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Content>
            <Content component="small">
              {listItems.length} of {totalCount} pipelines
            </Content>
          </Content>
        </FlexItem>
        <FlexItem>
          <Button
            id="pipelines-view-all"
            aria-labelledby="pipelines-view-all Pipelines-title"
            variant="link"
            component={(props: React.ComponentProps<'a'>) => (
              <Link
                {...props}
                to={`/projects/${currentProject.metadata.name}?section=${ProjectSectionID.PIPELINES}`}
              />
            )}
          >
            View all
          </Button>
        </FlexItem>
      </Flex>
    </Flex>
  );
};

const PipelinesCardMetrics: React.FC = () => {
  const { pipelinesServer } = usePipelinesAPI();
  const { currentProject } = React.useContext(ProjectDetailsContext);

  const [{ items: pipelines, totalSize: pipelinesCount }, pipelinesLoaded, pipelinesError] =
    usePipelines({ pageSize: 5 });
  const [{ totalSize: activeRunsCount }, activeRunsLoaded, activeRunsError] = usePipelineActiveRuns(
    { pageSize: 1 },
  );
  const [{ totalSize: archivedRunsCount }, archivedRunsLoaded, archivedRunsError] =
    usePipelineArchivedRuns({ pageSize: 1 });
  const [{ totalSize: scheduledCount }, scheduledLoaded, scheduledError] = usePipelineRecurringRuns(
    { pageSize: 1 },
  );
  const [{ totalSize: experimentsCount }, experimentsLoaded, experimentsError] = useExperiments({
    pageSize: 1,
  });

  const loaded =
    !pipelinesServer.initializing &&
    pipelinesLoaded &&
    activeRunsLoaded &&
    archivedRunsLoaded &&
    scheduledLoaded &&
    experimentsLoaded;

  const loadError =
    pipelinesError || activeRunsError || archivedRunsError || scheduledError || experimentsError;

  const triggeredCount = activeRunsCount + archivedRunsCount;

  const statistics = React.useMemo(
    () => [
      { count: pipelinesCount, text: pipelinesCount === 1 ? 'Pipeline' : 'Pipelines' },
      { count: scheduledCount, text: scheduledCount === 1 ? 'Schedule' : 'Schedules' },
      { count: triggeredCount, text: triggeredCount === 1 ? 'Run' : 'Runs' },
      { count: experimentsCount, text: experimentsCount === 1 ? 'Experiment' : 'Experiments' },
    ],
    [experimentsCount, pipelinesCount, scheduledCount, triggeredCount],
  );

  if (loadError) {
    return (
      <EmptyState
        headingLevel="h3"
        icon={() => (
          <ExclamationCircleIcon
            style={{
              color: 'var(--pf-t--global--icon--color--status--danger--default)',
              width: '32px',
              height: '32px',
            }}
          />
        )}
        variant="xs"
      >
        <EmptyStateBody>{loadError.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!loaded) {
    return (
      <EmptyState headingLevel="h3" icon={() => <Spinner size="lg" />} variant="xs">
        <EmptyStateBody>Loading...</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <EnsureCompatiblePipelineServer>
      {pipelinesCount ? (
        <MetricsContents
          title="Pipelines"
          createButton={<ImportPipelineButton variant="link" />}
          createText="Import pipeline"
          statistics={statistics}
          listItems={
            <PipelineCardItems
              pipelines={pipelines}
              loaded={loaded}
              error={loadError}
              totalCount={pipelinesCount}
              currentProject={currentProject}
            />
          }
        />
      ) : (
        <>
          <CardBody>
            <Content>
              <Content component="small">
                Pipelines are platforms for building and deploying portable and scalable
                machine-learning (ML) workflows. You can import a pipeline or create one in a
                workbench.
              </Content>
            </Content>
          </CardBody>
          <CardFooter>
            <ImportPipelineButton variant="link" isInline />
          </CardFooter>
        </>
      )}
    </EnsureCompatiblePipelineServer>
  );
};

const PipelinesOverviewCardComposite: React.FC = () => {
  const { pipelinesServer, pipelineLoadError } = usePipelinesAPI();
  const {
    notebooks: { data: notebooks, loaded: notebooksLoaded, error: notebooksError },
  } = React.useContext(ProjectDetailsContext);

  const [{ totalSize: pipelinesCount }] = useSafePipelines({ pageSize: 1 });

  if (pipelineLoadError) {
    return (
      <ErrorOverviewCard
        id="Pipelines"
        objectType={ProjectObjectType.pipeline}
        sectionType={pipelinesCount ? SectionType.training : SectionType.organize}
        title="Pipelines"
        popoverHeaderContent="About pipelines"
        popoverBodyContent="Pipelines are platforms for building and deploying portable and scalable machine-learning (ML) workflows. You can import a pipeline or create one in a workbench."
        error={pipelineLoadError}
      />
    );
  }

  const renderContent = () => {
    if (pipelinesServer.initializing) {
      return (
        <EmptyState headingLevel="h3" icon={() => <Spinner size="lg" />} variant="xs">
          <EmptyStateBody>Loading...</EmptyStateBody>
        </EmptyState>
      );
    }
    if (!pipelinesServer.installed) {
      return (
        <>
          <CardBody>
            <Stack hasGutter>
              <Content>
                <Content component="small">
                  To create or use pipelines, you must first configure a pipeline server in this
                  project. A pipeline server provides the infrastructure necessary for the pipeline
                  to execute steps, track results, and manage runs.
                </Content>
              </Content>
              {notebooksLoaded && !notebooksError && notebooks.length > 0 ? (
                <Alert
                  isInline
                  isPlain
                  variant="warning"
                  title="Restart running workbenches after configuring the pipeline server"
                >
                  If you&apos;ve already created pipelines in a workbench, restart the workbench
                  after configuring the pipeline server to view your pipelines here.
                </Alert>
              ) : null}
            </Stack>
          </CardBody>
          <CardFooter>
            <CreatePipelineServerButton
              variant={ButtonVariant.link}
              isInline
              title="Configure pipeline server"
            />
          </CardFooter>
        </>
      );
    }

    return (
      <EnsureAPIAvailability inTab>
        <EnsureCompatiblePipelineServer emptyStateVariant={EmptyStateVariant.xs}>
          <PipelinesCardMetrics />
        </EnsureCompatiblePipelineServer>
      </EnsureAPIAvailability>
    );
  };

  return (
    <PipelineAndVersionContextProvider>
      <OverviewCard
        id="Pipelines"
        objectType={ProjectObjectType.pipeline}
        sectionType={pipelinesCount ? SectionType.training : SectionType.organize}
        title="Pipelines"
        popoverHeaderContent="About pipelines"
        popoverBodyContent="Pipelines are platforms for building and deploying portable and scalable machine-learning (ML) workflows. You can import a pipeline or create one in a workbench."
        data-testid="section-pipelines"
      >
        {renderContent()}
      </OverviewCard>
    </PipelineAndVersionContextProvider>
  );
};

export default PipelinesOverviewCardComposite;
