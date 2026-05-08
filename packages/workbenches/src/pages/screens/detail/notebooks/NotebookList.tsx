import * as React from 'react';
import { Button, Popover, Tooltip } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { ProjectSectionTitles } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionTitles';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import {
  FAST_POLL_INTERVAL,
  POLL_INTERVAL,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import DetailsSection from '@odh-dashboard/dashboard-foundation-frontend/components/DetailsSection';
import EmptyDetailsView from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyDetailsView';
import DashboardPopupIconButton from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardPopupIconButton';
import {
  ProjectObjectType,
  typedEmptyImage,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import useRefreshInterval from '@odh-dashboard/dashboard-foundation-frontend/utilities/useRefreshInterval';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import { KUEUE_WORKBENCH_CREATION_DISABLED_MESSAGE } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/kueueConstants';
import { useAccessReview } from '@odh-dashboard/dashboard-foundation-frontend/api/useAccessReview';
import { NotebookModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kubeflow';
import { CREATE_WORKBENCH_DISABLED_MESSAGE } from '@odh-dashboard/workbenches/pages/screens/detail/const';
import useKueueNotebookAlerts from '@odh-dashboard/workbenches/pages/notebook/useKueueNotebookAlerts';
import NotebookTable from './NotebookTable';

const NotebookList: React.FC = () => {
  const {
    currentProject,
    notebooks: {
      data: notebooks,
      loaded: notebooksLoaded,
      error: notebooksError,
      refresh: refreshNotebooks,
    },
    kueueStatusByNotebookName,
    isKueueLoaded,
  } = React.useContext(ProjectDetailsContext);
  const projectName = currentProject.metadata.name;
  const createWorkbenchHref = `/projects/${projectName}/spawner`;
  const isNotebooksEmpty = notebooks.length === 0;

  useRefreshInterval(FAST_POLL_INTERVAL, () =>
    notebooks
      .filter((notebookState) => notebookState.isStarting || notebookState.isStopping)
      .forEach((notebookState) => notebookState.refresh()),
  );

  useRefreshInterval(POLL_INTERVAL, () =>
    notebooks
      .filter((notebookState) => !notebookState.isStarting && !notebookState.isStopping)
      .forEach((notebookState) => notebookState.refresh()),
  );

  useKueueNotebookAlerts(notebooks, kueueStatusByNotebookName, isKueueLoaded);

  const { isKueueDisabled } = useKueueConfiguration(currentProject);

  const [allowCreate, allowCreateLoaded] = useAccessReview({
    group: NotebookModel.apiGroup,
    resource: NotebookModel.plural,
    namespace: currentProject.metadata.name,
    verb: 'create',
  });

  // Only disable for permission if the check has loaded and the user lacks permission
  const isCreateDisabled = isKueueDisabled || (allowCreateLoaded && !allowCreate);
  const createDisabledTooltip = isKueueDisabled
    ? KUEUE_WORKBENCH_CREATION_DISABLED_MESSAGE
    : !allowCreate
    ? CREATE_WORKBENCH_DISABLED_MESSAGE
    : undefined;

  const getCreateButton = () => {
    if (isCreateDisabled) {
      return (
        <Tooltip content={createDisabledTooltip}>
          <Button
            key={`action-${ProjectSectionID.WORKBENCHES}`}
            component="button"
            data-testid="create-workbench-button"
            variant="primary"
            isAriaDisabled
          >
            Create workbench
          </Button>
        </Tooltip>
      );
    }
    return (
      <Button
        key={`action-${ProjectSectionID.WORKBENCHES}`}
        component={(props: React.ComponentProps<'a'>) => (
          <Link {...props} to={createWorkbenchHref} />
        )}
        data-testid="create-workbench-button"
        variant="primary"
      >
        Create workbench
      </Button>
    );
  };

  return (
    <DetailsSection
      objectType={ProjectObjectType.notebook}
      id={ProjectSectionID.WORKBENCHES}
      title={(!isNotebooksEmpty && ProjectSectionTitles[ProjectSectionID.WORKBENCHES]) || ''}
      popover={
        !isNotebooksEmpty && (
          <Popover
            headerContent="About workbenches"
            bodyContent="A workbench is an isolated area where you can work with models in your preferred IDE, such as a Jupyter notebook. You can add accelerators and connections, create pipelines, and add cluster storage in your workbench."
          >
            <DashboardPopupIconButton
              icon={<OutlinedQuestionCircleIcon />}
              aria-label="More info"
            />
          </Popover>
        )
      }
      actions={[getCreateButton()]}
      isLoading={!notebooksLoaded}
      loadError={notebooksError}
      isEmpty={isNotebooksEmpty}
      emptyState={
        <EmptyDetailsView
          title="Start by creating a workbench"
          description="A workbench is an isolated area where you can work with models in your preferred IDE, such as a Jupyter notebook. You can add accelerators and connections, create pipelines, and add cluster storage in your workbench."
          iconImage={typedEmptyImage(ProjectObjectType.notebook)}
          imageAlt="create a workbench"
          createButton={getCreateButton()}
        />
      }
    >
      {!isNotebooksEmpty ? (
        <NotebookTable notebookStates={notebooks} refresh={refreshNotebooks} />
      ) : null}
    </DetailsSection>
  );
};

export default NotebookList;
