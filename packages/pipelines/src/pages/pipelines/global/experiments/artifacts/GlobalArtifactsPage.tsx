import React from 'react';

import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { artifactsBaseRoute } from '@odh-dashboard/pipelines/routes/artifacts';
import {
  usePipelinesAPI,
  MlmdListContextProvider,
} from '@odh-dashboard/pipelines/concepts/context';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import { ArtifactsList } from './ArtifactsList';
import { artifactsPageDescription, artifactsPageTitle } from './constants';

export const GlobalArtifactsPage: React.FC = () => {
  const pipelinesAPI = usePipelinesAPI();

  return (
    <PipelineCoreApplicationPage
      title={
        <TitleWithIcon title={artifactsPageTitle} objectType={ProjectObjectType.pipelineArtifact} />
      }
      description={artifactsPageDescription}
      headerAction={<PipelineServerActions isDisabled={!pipelinesAPI.pipelinesServer.installed} />}
      getRedirectPath={artifactsBaseRoute}
      overrideTimeout
      accessDomain="artifacts"
    >
      <EnsureAPIAvailability>
        <EnsureCompatiblePipelineServer>
          <MlmdListContextProvider>
            <ArtifactsList />
          </MlmdListContextProvider>
        </EnsureCompatiblePipelineServer>
      </EnsureAPIAvailability>
    </PipelineCoreApplicationPage>
  );
};
