import * as React from 'react';
import { ProjectsContext } from '@odh-dashboard/ui-core/context/ProjectsContext';
import MainDashboardClusterDetailsVariablesProvider from './ClusterDetailsVariablesProvider';
import DashboardView from './DashboardView';
import { usePersesDashboards } from '../api/usePersesDashboards';

const DashboardPage: React.FC = () => {
  const {
    projects,
    loaded: projectsLoaded,
    loadError: projectsLoadError,
  } = React.useContext(ProjectsContext);
  const { dashboards, loaded: dashboardsLoaded, error: dashboardsError } = usePersesDashboards();

  const dashboardProjects = React.useMemo(
    () =>
      projects.map((project) => ({ name: project.metadata.name, label: project.metadata.name })),
    [projects],
  );
  return (
    <DashboardView
      dashboards={dashboards}
      dashboardsLoaded={dashboardsLoaded}
      dashboardsError={dashboardsError}
      projects={dashboardProjects}
      projectsLoaded={projectsLoaded}
      projectsLoadError={projectsLoadError}
      ClusterDetailsAdapter={MainDashboardClusterDetailsVariablesProvider}
    />
  );
};

export default DashboardPage;
