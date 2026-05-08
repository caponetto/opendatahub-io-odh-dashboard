import * as React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useInferenceServices from '@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices';
import useModelMetricsEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelMetricsEnabled';
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
import { isModelServingMetricsRoutesExtension } from '@odh-dashboard/model-serving-shared/extension-points';
import { ProjectMetricsContextProvider } from '@odh-dashboard/projects-shared/concepts/projects/ProjectMetricsContext';
import { getSlimProjectMetricsRoute, SLIM_MODEL_SERVING_ROUTE } from './consts';

const SlimProjectMetricsRoute: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const { projects } = React.useContext(ProjectsContext);
  const project = projects.find(byName(namespace)) ?? null;
  useSyncPreferredProject(project);

  const [metricsRoutesExtensions, extensionsLoaded] = useResolvedExtensions(
    isModelServingMetricsRoutesExtension,
  );

  const inferenceServices = useInferenceServices(namespace, undefined, undefined, undefined, {
    refreshRate: POLL_INTERVAL,
  });
  const [modelMetricsEnabled] = useModelMetricsEnabled();
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
  const projectsEnabled = useIsAreaAvailable(SupportedArea.DS_PROJECTS_VIEW).status;

  if (!extensionsLoaded || metricsRoutesExtensions.length === 0) {
    return null;
  }

  const MetricsRoutes = metricsRoutesExtensions[0].properties.Component.default;

  if (!project || !namespace) {
    if (projectsEnabled && projects.length === 0) {
      return <Navigate to={SLIM_MODEL_SERVING_ROUTE} replace />;
    }

    return (
      <InvalidProject
        namespace={namespace}
        title="Problem loading project metrics"
        getRedirectPath={getSlimProjectMetricsRoute}
      />
    );
  }

  return (
    <ProjectMetricsContextProvider
      project={project}
      namespace={namespace}
      inferenceServices={inferenceServices}
    >
      <MetricsRoutes
        modelMetricsEnabled={modelMetricsEnabled}
        biasMetricsAreaAvailable={biasMetricsAreaAvailable}
      />
    </ProjectMetricsContextProvider>
  );
};

export default SlimProjectMetricsRoute;
