import * as React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useServingRuntimes from '@odh-dashboard/model-serving-shared/concepts/modelServing/useServingRuntimes';
import useInferenceServices from '@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices';
import useServingRuntimeSecrets from '@odh-dashboard/model-serving-shared/concepts/modelServing/useServingRuntimeSecrets';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import InvalidProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/InvalidProject';
import useSyncPreferredProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject';
import useTemplateOrder from '@odh-dashboard/model-serving-shared/concepts/modelServing/useTemplateOrder';
import useTemplateDisablement from '@odh-dashboard/model-serving-shared/concepts/modelServing/useTemplateDisablement';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { getTokenNames } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { SecretKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useTemplates } from '@odh-dashboard/model-serving-shared/concepts/modelServing/useTemplates';
import { useGroups } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/groups';
import { useWatchHardwareProfiles } from '@odh-dashboard/hardware-profiles-shared/utilities/useWatchHardwareProfiles';
import useProjectKueueInfo from '@odh-dashboard/distributed-workloads-shared/concepts/distributedWorkloads/useProjectKueueInfo';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import useConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useConnections';
import { PipelineContextProviderWrapper } from '@odh-dashboard/workbenches/concepts/usePipelinesIntegration';
import useProjectNotebookStates from './notebook/useProjectNotebookStates';
import { useKueueStatusForNotebooks } from './notebook/useKueueStatusForNotebooks';
import useProjectPvcs from './screens/detail/storage/useProjectPvcs';
import useProjectSharing from './projectSharing/useProjectSharing';

const ProjectDetailsContextProvider: React.FC = () => {
  const { dashboardNamespace } = useDashboardNamespace();
  const { namespace } = useParams<{ namespace: string }>();
  const { projects } = React.useContext(ProjectsContext);
  const project = projects.find(byName(namespace)) ?? null;
  useSyncPreferredProject(project);
  const notebooks = useProjectNotebookStates(namespace, { refreshRate: POLL_INTERVAL });
  const { kueueStatusByNotebookName, isLoading: isKueueLoading } = useKueueStatusForNotebooks(
    notebooks.data,
    project ?? undefined,
  );
  const isKueueLoaded = !isKueueLoading;

  const pvcs = useProjectPvcs(namespace, { refreshRate: POLL_INTERVAL });
  const connections = useConnections(namespace, { refreshRate: POLL_INTERVAL });
  const servingRuntimes = useServingRuntimes(namespace, undefined, { refreshRate: POLL_INTERVAL });
  const servingRuntimeTemplates = useTemplates(dashboardNamespace);
  const servingRuntimeTemplateOrder = useTemplateOrder(dashboardNamespace);
  const servingRuntimeTemplateDisablement = useTemplateDisablement(dashboardNamespace);
  const inferenceServices = useInferenceServices(namespace, undefined, undefined, undefined, {
    refreshRate: POLL_INTERVAL,
  });
  const serverSecrets = useServingRuntimeSecrets(namespace, { refreshRate: POLL_INTERVAL });
  const projectSharingRB = useProjectSharing(namespace, { refreshRate: POLL_INTERVAL });

  const groups = useGroups();
  const projectHardwareProfiles = useWatchHardwareProfiles(namespace);

  const { localQueues } = useProjectKueueInfo(project, namespace);
  const pageName = 'project details';

  const filterTokens = React.useCallback(
    (servingRuntimeName?: string): SecretKind[] => {
      if (!namespace || !servingRuntimeName) {
        return [];
      }
      const { serviceAccountName } = getTokenNames(servingRuntimeName, namespace);

      const secrets = serverSecrets.data.filter(
        (secret) =>
          secret.metadata.annotations?.['kubernetes.io/service-account.name'] ===
          serviceAccountName,
      );

      return secrets;
    },
    [namespace, serverSecrets],
  );

  const projectsEnabled = useIsAreaAvailable(SupportedArea.DS_PROJECTS_VIEW).status;
  const pipelinesEnabled = useIsAreaAvailable(SupportedArea.DS_PIPELINES).status;

  const contextValue = React.useMemo(
    () =>
      project
        ? {
            currentProject: project,
            notebooks,
            pvcs,
            connections,
            servingRuntimes,
            servingRuntimeTemplates,
            servingRuntimeTemplateOrder,
            servingRuntimeTemplateDisablement,
            inferenceServices,
            filterTokens,
            serverSecrets,
            projectSharingRB,
            groups,
            projectHardwareProfiles,
            localQueues,
            kueueStatusByNotebookName,
            isKueueLoaded,
          }
        : null,
    [
      project,
      notebooks,
      kueueStatusByNotebookName,
      isKueueLoaded,
      pvcs,
      connections,
      servingRuntimes,
      servingRuntimeTemplates,
      servingRuntimeTemplateOrder,
      servingRuntimeTemplateDisablement,
      inferenceServices,
      filterTokens,
      serverSecrets,
      projectSharingRB,
      groups,
      projectHardwareProfiles,
      localQueues,
    ],
  );

  if (!project || !contextValue) {
    if (projectsEnabled && projects.length === 0) {
      // No projects, but we do have the projects view -- navigate them so they can go through normal flows
      return <Navigate to="/projects" replace />;
    }

    return (
      <InvalidProject
        namespace={namespace}
        title={`Problem loading ${pageName}`}
        getRedirectPath={(ns) => `/projects/${ns}`}
      />
    );
  }

  return (
    <ProjectDetailsContext.Provider value={contextValue}>
      {pipelinesEnabled ? (
        <PipelineContextProviderWrapper namespace={project.metadata.name}>
          <Outlet />
        </PipelineContextProviderWrapper>
      ) : (
        <Outlet />
      )}
    </ProjectDetailsContext.Provider>
  );
};

export default ProjectDetailsContextProvider;
