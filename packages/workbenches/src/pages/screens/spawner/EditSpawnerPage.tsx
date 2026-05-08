import * as React from 'react';
import { Link, useParams } from 'react-router';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { NotebookState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import SpawnerPage from './SpawnerPage';

const EditSpawnerPage: React.FC = () => {
  const {
    currentProject,
    notebooks: { data, loaded, error },
  } = React.useContext(ProjectDetailsContext);
  const { notebookName } = useParams();
  const ref = React.useRef<NotebookState>();
  if (!ref.current) {
    ref.current = data.find(
      (notebookState) => notebookState.notebook.metadata.name === notebookName,
    );
  }

  if (error) {
    return (
      <Bullseye>
        <EmptyState
          headingLevel="h4"
          icon={ExclamationCircleIcon}
          titleText="Problem loading project details"
        >
          <EmptyStateBody>{error.message}</EmptyStateBody>
          <EmptyStateFooter>
            <Button
              variant="primary"
              component={(props: React.ComponentProps<'a'>) => <Link {...props} to="/projects" />}
            >
              View my projects
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!ref.current) {
    return (
      <Bullseye>
        <EmptyState
          data-testid="error-message-title"
          headingLevel="h4"
          icon={ExclamationCircleIcon}
          titleText="Unable to edit workbench"
        >
          <EmptyStateBody>
            We were unable to find a notebook by this name in your project{' '}
            {getDisplayNameFromK8sResource(currentProject)}.
          </EmptyStateBody>
          <EmptyStateFooter>
            <Button
              data-testid="return-to-project-button"
              variant="primary"
              component={(props: React.ComponentProps<'a'>) => (
                <Link {...props} to={`/projects/${currentProject.metadata.name}`} />
              )}
            >
              Return to {getDisplayNameFromK8sResource(currentProject)}
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  return <SpawnerPage existingNotebook={ref.current.notebook} />;
};

export default EditSpawnerPage;
