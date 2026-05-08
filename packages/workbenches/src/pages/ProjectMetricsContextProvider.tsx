import * as React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useInferenceServices from '@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import InvalidProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/InvalidProject';
import useSyncPreferredProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { ProjectMetricsContextProvider as SharedProjectMetricsContextProvider } from '@odh-dashboard/projects-shared/concepts/projects/ProjectMetricsContext';

const ProjectMetricsContextProvider: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const { projects } = React.useContext(ProjectsContext);
  const project = projects.find(byName(namespace)) ?? null;
  useSyncPreferredProject(project);

  const inferenceServices = useInferenceServices(namespace, undefined, undefined, undefined, {
    refreshRate: POLL_INTERVAL,
  });
  const projectsEnabled = useIsAreaAvailable(SupportedArea.DS_PROJECTS_VIEW).status;

  if (!project || !namespace) {
    if (projectsEnabled && projects.length === 0) {
      return <Navigate to="/projects" replace />;
    }

    return (
      <InvalidProject
        namespace={namespace}
        title="Problem loading project metrics"
        getRedirectPath={(ns) => `/projects/${ns}`}
      />
    );
  }

  return (
    <SharedProjectMetricsContextProvider
      project={project}
      namespace={namespace}
      inferenceServices={inferenceServices}
    >
      <Outlet />
    </SharedProjectMetricsContextProvider>
  );
};

export default ProjectMetricsContextProvider;
