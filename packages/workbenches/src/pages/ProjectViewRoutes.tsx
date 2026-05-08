import * as React from 'react';
import { Navigate, Route } from 'react-router-dom';
import useModelMetricsEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelMetricsEnabled';
import ProjectsRoutes from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsRoutes';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { ProjectMetricsRoutesCompositeWrapper } from '@odh-dashboard/workbenches/concepts/useModelServingIntegration';
import ProjectDetails from './screens/detail/ProjectDetails';
import ProjectView from './screens/projects/ProjectView';
import ProjectDetailsContextProvider from './ProjectDetailsContext';
import ProjectMetricsContextProvider from './ProjectMetricsContextProvider';
import SpawnerPage from './screens/spawner/SpawnerPage';
import EditSpawnerPage from './screens/spawner/EditSpawnerPage';
import ProjectPermissionsAssignRoles from './projectPermissions/ProjectPermissionsAssignRoles';

const ProjectViewRoutes: React.FC = () => {
  const [modelMetricsEnabled] = useModelMetricsEnabled();
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;

  return (
    <ProjectsRoutes>
      <Route path="/" element={<ProjectView />} />
      <Route path="/:namespace/metrics/*" element={<ProjectMetricsContextProvider />}>
        <Route
          path="*"
          element={
            <ProjectMetricsRoutesCompositeWrapper
              modelMetricsEnabled={modelMetricsEnabled}
              biasMetricsAreaAvailable={biasMetricsAreaAvailable}
            />
          }
        />
      </Route>
      <Route path="/:namespace/*" element={<ProjectDetailsContextProvider />}>
        <Route index element={<ProjectDetails />} />
        <Route path="spawner" element={<SpawnerPage />} />
        <Route path="spawner/:notebookName" element={<EditSpawnerPage />} />
        <Route path="permissions" element={<Navigate to="..?section=permissions" replace />} />
        <Route path="permissions/assign" element={<ProjectPermissionsAssignRoles />} />
        <Route path="*" element={<Navigate to="." />} />
      </Route>
      <Route path="*" element={<Navigate to="." />} />
    </ProjectsRoutes>
  );
};

export default ProjectViewRoutes;
