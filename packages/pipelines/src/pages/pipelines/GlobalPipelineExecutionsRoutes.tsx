import * as React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProjectsRoutes from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsRoutes';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { executionsBaseRoute } from '@odh-dashboard/pipelines/routes/executions';
import GlobalPipelineCoreLoader from '@odh-dashboard/pipelines/pages/pipelines/global/GlobalPipelineCoreLoader';
import {
  executionsPageDescription,
  executionsPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/const';
import GlobalExecutions from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/GlobalExecutions';
import ExecutionDetails from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/details/ExecutionDetails';
import GlobalPipelineCoreDetails from '@odh-dashboard/pipelines/pages/pipelines/global/GlobalPipelineCoreDetails';

const GlobalPipelineExecutionsRoutes: React.FC = () => (
  <ProjectsRoutes>
    <Route
      path="/:namespace?/*"
      element={
        <GlobalPipelineCoreLoader
          title={
            <TitleWithIcon
              title={executionsPageTitle}
              objectType={ProjectObjectType.pipelineExecution}
            />
          }
          description={executionsPageDescription}
          getInvalidRedirectPath={executionsBaseRoute}
        />
      }
    >
      <Route index element={<GlobalExecutions />} />
      <Route
        path=":executionId"
        element={
          <GlobalPipelineCoreDetails
            BreadcrumbDetailsComponent={ExecutionDetails}
            pageName="Executions"
            redirectPath={executionsBaseRoute}
          />
        }
      />
      <Route path="*" element={<Navigate to="." />} />
    </Route>
  </ProjectsRoutes>
);

export default GlobalPipelineExecutionsRoutes;
