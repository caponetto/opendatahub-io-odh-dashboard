import * as React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProjectsRoutes from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsRoutes';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { pipelinesBaseRoute } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { globNamespaceAll } from '@odh-dashboard/pipelines/routes/global';
import GlobalPipelineCoreLoader from '@odh-dashboard/pipelines/pages/pipelines/global/GlobalPipelineCoreLoader';
import {
  pipelinesPageDescription,
  pipelinesPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/pipelines/const';
import { PipelineVersionCoreDetails } from '@odh-dashboard/pipelines/pages/pipelines/global/GlobalPipelineCoreDetails';
import PipelineDetails from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipeline/PipelineDetails';
import PipelineAvailabilityLoader from '@odh-dashboard/pipelines/pages/pipelines/global/pipelines/PipelineAvailabilityLoader';
import GlobalPipelines from './global/pipelines/GlobalPipelines';

const GlobalPipelinesRoutes: React.FC = () => (
  <ProjectsRoutes>
    <Route
      path={globNamespaceAll}
      element={
        <GlobalPipelineCoreLoader
          title={
            <TitleWithIcon title={pipelinesPageTitle} objectType={ProjectObjectType.pipeline} />
          }
          description={pipelinesPageDescription}
          getInvalidRedirectPath={pipelinesBaseRoute}
        />
      }
    >
      <Route index element={<GlobalPipelines />} />
      <Route element={<PipelineAvailabilityLoader />}>
        <Route
          path=":pipelineId/:pipelineVersionId/view"
          element={<PipelineVersionCoreDetails BreadcrumbDetailsComponent={PipelineDetails} />}
        />
        <Route path="*" element={<Navigate to="." />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="." />} />
  </ProjectsRoutes>
);

export default GlobalPipelinesRoutes;
