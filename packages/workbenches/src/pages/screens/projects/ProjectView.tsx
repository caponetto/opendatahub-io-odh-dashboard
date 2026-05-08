import * as React from 'react';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useAccessReview } from '@odh-dashboard/dashboard-foundation-frontend/api/useAccessReview';
import { AccessReviewResourceAttributes } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { useAppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';
import LaunchJupyterButton from '@odh-dashboard/workbenches/pages/screens/projects/LaunchJupyterButton';
import EmptyProjects from './EmptyProjects';
import ProjectListView from './ProjectListView';

const accessReviewResource: AccessReviewResourceAttributes = {
  group: 'project.openshift.io',
  resource: 'projectrequests',
  verb: 'create',
};

const ProjectView: React.FC = () => {
  const { dashboardConfig } = useAppContext();
  const { projects } = React.useContext(ProjectsContext);
  const [allowCreate, rbacLoaded] = useAccessReview(accessReviewResource);

  return (
    <ApplicationsPage
      title={<TitleWithIcon title="Projects" objectType={ProjectObjectType.project} />}
      headerAction={
        dashboardConfig.spec.notebookController?.enabled ? <LaunchJupyterButton /> : undefined
      }
      description={
        rbacLoaded
          ? `View your existing projects${allowCreate ? ' or create new projects' : ''}.`
          : undefined
      }
      loaded={rbacLoaded}
      empty={projects.length === 0}
      emptyStatePage={<EmptyProjects allowCreate={allowCreate} />}
      provideChildrenPadding
    >
      <ProjectListView allowCreate={allowCreate} />
    </ApplicationsPage>
  );
};

export default ProjectView;
