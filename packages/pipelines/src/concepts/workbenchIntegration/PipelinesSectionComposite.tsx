import * as React from 'react';
import {
  Bullseye,
  Button,
  ButtonVariant,
  Popover,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { TableVariant } from '@patternfly/react-table';
import DetailsSection from '@odh-dashboard/dashboard-foundation-frontend/components/DetailsSection';
import EmptyStateErrorMessage from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyStateErrorMessage';
import IndentSection from '@odh-dashboard/dashboard-foundation-frontend/components/IndentSection';
import DashboardPopupIconButton from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardPopupIconButton';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { ProjectSectionTitles } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionTitles';
import { pipelinesBaseRoute } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { TABLE_CONTENT_LIMIT } from '@odh-dashboard/pipelines/concepts/const';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineAndVersionContextProvider from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import ImportPipelineSplitButton from '@odh-dashboard/pipelines/concepts/content/import/ImportPipelineSplitButton';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelinesTable from '@odh-dashboard/pipelines/concepts/content/tables/pipeline/PipelinesTable';
import usePipelinesTable from '@odh-dashboard/pipelines/concepts/content/tables/pipeline/usePipelinesTable';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import NoPipelineServer from '@odh-dashboard/pipelines/concepts/NoPipelineServer';

type PipelinesListInternalProps = {
  setIsPipelinesEmpty: (isEmpty: boolean) => void;
};

const PipelinesListInternal: React.FC<PipelinesListInternalProps> = ({ setIsPipelinesEmpty }) => {
  const { namespace } = usePipelinesAPI();
  const [
    [{ items: pipelines, totalSize }, loaded, loadError, refresh],
    { initialLoaded, ...tableProps },
  ] = usePipelinesTable(TABLE_CONTENT_LIMIT);

  const isPipelinesEmpty = pipelines.length === 0;

  React.useEffect(() => {
    setIsPipelinesEmpty(isPipelinesEmpty);
  }, [isPipelinesEmpty, setIsPipelinesEmpty]);

  if (loadError) {
    return (
      <EmptyStateErrorMessage title="Error displaying pipelines" bodyText={loadError.message} />
    );
  }

  if (!loaded && !initialLoaded) {
    return (
      <Bullseye style={{ minHeight: 150 }}>
        <Spinner />
      </Bullseye>
    );
  }

  if (loaded && pipelines.length === 0 && !tableProps.filter) {
    return <NoPipelineServer variant={ButtonVariant.primary} />;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <PipelinesTable
          {...tableProps}
          totalSize={totalSize}
          loading={!loaded}
          pipelines={pipelines}
          aria-label="pipelines table"
          refreshPipelines={refresh}
          variant={TableVariant.compact}
        />
      </StackItem>
      {totalSize > TABLE_CONTENT_LIMIT && (
        <StackItem>
          <IndentSection>
            <Button
              variant="link"
              component={(props: React.ComponentProps<'a'>) => (
                <Link {...props} to={pipelinesBaseRoute(namespace)} />
              )}
            >
              View all pipelines
            </Button>
          </IndentSection>
        </StackItem>
      )}
    </Stack>
  );
};

const PipelinesSectionComposite: React.FC = () => {
  const {
    apiAvailable,
    pipelinesServer: { initializing, installed, timedOut, compatible },
  } = usePipelinesAPI();
  const [isPipelinesEmpty, setIsPipelinesEmpty] = React.useState(false);

  const hideImportButton = installed && !compatible;

  const actions: React.ComponentProps<typeof DetailsSection>['actions'] = [];
  if (!hideImportButton) {
    actions.push(
      <ImportPipelineSplitButton
        disable={!installed}
        disableUploadVersion={installed && isPipelinesEmpty}
        key={`action-${ProjectSectionID.PIPELINES}`}
        variant="secondary"
      />,
    );
  }
  actions.push(
    <PipelineServerActions
      key={`action-${ProjectSectionID.PIPELINES}-1`}
      isDisabled={!initializing && !installed}
      variant="kebab"
    />,
  );

  return (
    <PipelineAndVersionContextProvider>
      <EnsureAPIAvailability>
        <DetailsSection
          id={ProjectSectionID.PIPELINES}
          objectType={ProjectObjectType.pipeline}
          title={ProjectSectionTitles[ProjectSectionID.PIPELINES]}
          data-testid={ProjectSectionID.PIPELINES}
          popover={
            installed ? (
              <Popover
                headerContent="About pipelines"
                bodyContent="Pipelines are platforms for building and deploying portable and scalable machine-learning (ML) workflows. You can import a pipeline or create one in a workbench."
              >
                <DashboardPopupIconButton
                  icon={<OutlinedQuestionCircleIcon />}
                  aria-label="More info"
                />
              </Popover>
            ) : null
          }
          actions={actions}
          isLoading={(!timedOut && compatible && !apiAvailable && installed) || initializing}
          isEmpty={!installed}
          emptyState={<NoPipelineServer variant={ButtonVariant.primary} />}
          showDivider={isPipelinesEmpty}
        >
          <EnsureCompatiblePipelineServer>
            <PipelinesListInternal setIsPipelinesEmpty={setIsPipelinesEmpty} />
          </EnsureCompatiblePipelineServer>
        </DetailsSection>
      </EnsureAPIAvailability>
    </PipelineAndVersionContextProvider>
  );
};

export default PipelinesSectionComposite;
