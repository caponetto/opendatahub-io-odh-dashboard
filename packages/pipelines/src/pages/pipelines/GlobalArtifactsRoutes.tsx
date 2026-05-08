import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import ProjectsRoutes from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsRoutes';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { artifactsBaseRoute } from '@odh-dashboard/pipelines/routes/artifacts';
import GlobalPipelineCoreLoader from '@odh-dashboard/pipelines/pages/pipelines/global/GlobalPipelineCoreLoader';
import { GlobalArtifactsPage } from './global/experiments/artifacts/GlobalArtifactsPage';
import GlobalPipelineCoreDetails from './global/GlobalPipelineCoreDetails';
import { ArtifactDetails } from './global/experiments/artifacts/ArtifactDetails/ArtifactDetails';
import {
  artifactsPageDescription,
  artifactsPageTitle,
} from './global/experiments/artifacts/constants';

const GlobalArtifactsRoutes: React.FC = () => (
  <ProjectsRoutes>
    <Route
      path="/:namespace?/*"
      element={
        <GlobalPipelineCoreLoader
          title={
            <TitleWithIcon
              title={artifactsPageTitle}
              objectType={ProjectObjectType.pipelineArtifact}
            />
          }
          description={artifactsPageDescription}
          getInvalidRedirectPath={artifactsBaseRoute}
        />
      }
    >
      <Route index element={<GlobalArtifactsPage />} />
      <Route
        path=":artifactId"
        element={
          <GlobalPipelineCoreDetails
            pageName="Artifacts"
            redirectPath={artifactsBaseRoute}
            BreadcrumbDetailsComponent={ArtifactDetails}
          />
        }
      />
      <Route path="*" element={<Navigate to="." />} />
    </Route>
  </ProjectsRoutes>
);

export default GlobalArtifactsRoutes;
