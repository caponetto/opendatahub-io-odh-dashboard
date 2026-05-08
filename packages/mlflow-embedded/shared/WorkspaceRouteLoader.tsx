import * as React from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { EmptyState, EmptyStateBody, EmptyStateFooter } from '@patternfly/react-core';
import { WrenchIcon } from '@patternfly/react-icons/dist/esm/icons/wrench-icon';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import InvalidProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/InvalidProject';
import PipelineCoreProjectSelector from '@odh-dashboard/pipelines-shared/concepts/pipelines/PipelineCoreProjectSelector';
import NewProjectButton from '@odh-dashboard/dashboard-foundation-frontend/components/NewProjectButton';
import { WORKSPACE_QUERY_PARAM } from '@odh-dashboard/mlflow-shared/concepts/mlflow/routes';

type ApplicationPageProps = React.ComponentProps<typeof ApplicationsPage>;
type ApplicationPageRenderState = Pick<ApplicationPageProps, 'emptyStatePage' | 'empty'>;

interface WorkspaceRouteLoaderProps {
  title: React.ReactNode;
  getRedirectPath: (namespace: string) => string;
  noProjectsMessage: string;
  noProjectsTestId: string;
  PageComponent: React.ComponentType;
}

const NoProjectsEmptyState: React.FC<{
  message: string;
  testId: string;
  getRedirectPath: (namespace: string) => string;
}> = ({ message, testId, getRedirectPath }) => {
  const navigate = useNavigate();
  return (
    <EmptyState headingLevel="h4" icon={WrenchIcon} titleText="No projects" data-testid={testId}>
      <EmptyStateBody>{message}</EmptyStateBody>
      <EmptyStateFooter>
        <NewProjectButton
          closeOnCreate
          onProjectCreated={(projectName) => navigate(getRedirectPath(projectName))}
        />
      </EmptyStateFooter>
    </EmptyState>
  );
};

const WorkspaceRouteLoader: React.FC<WorkspaceRouteLoaderProps> = ({
  title,
  getRedirectPath,
  noProjectsMessage,
  noProjectsTestId,
  PageComponent,
}) => {
  const [searchParams] = useSearchParams();
  const namespace = searchParams.get(WORKSPACE_QUERY_PARAM);
  const { projects, preferredProject, loaded } = React.useContext(ProjectsContext);

  let renderStateProps: ApplicationPageRenderState & { children?: React.ReactNode };

  if (projects.length === 0) {
    renderStateProps = {
      empty: true,
      emptyStatePage: (
        <NoProjectsEmptyState
          message={noProjectsMessage}
          testId={noProjectsTestId}
          getRedirectPath={getRedirectPath}
        />
      ),
    };
  } else if (!namespace) {
    const redirectProject = preferredProject || projects[0];
    return <Navigate to={getRedirectPath(redirectProject.metadata.name)} replace />;
  } else {
    const foundProject = projects.find(byName(namespace));
    if (foundProject) {
      return <PageComponent />;
    }
    renderStateProps = {
      empty: true,
      emptyStatePage: <InvalidProject namespace={namespace} getRedirectPath={getRedirectPath} />,
    };
  }

  return (
    <ApplicationsPage
      title={title}
      {...renderStateProps}
      loaded={loaded}
      headerContent={
        <PipelineCoreProjectSelector
          getRedirectPath={getRedirectPath}
          queryParamNamespace={WORKSPACE_QUERY_PARAM}
        />
      }
      provideChildrenPadding
    />
  );
};

export default WorkspaceRouteLoader;
