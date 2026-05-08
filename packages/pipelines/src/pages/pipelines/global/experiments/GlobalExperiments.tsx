import * as React from 'react';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { experimentsBaseRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import PipelineAndVersionContextProvider from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import { ExperimentListTabs, experimentsPageDescription, experimentsPageTitle } from './const';
import GlobalExperimentsTabs from './GlobalExperimentsTabs';

type GlobalExperimentsParams = {
  tab: ExperimentListTabs;
};

const GlobalExperiments: React.FC<GlobalExperimentsParams> = ({ tab }) => {
  const pipelinesAPI = usePipelinesAPI();

  return (
    <PipelineCoreApplicationPage
      title={
        <TitleWithIcon
          title={experimentsPageTitle}
          objectType={ProjectObjectType.pipelineExperiment}
        />
      }
      description={experimentsPageDescription}
      headerAction={<PipelineServerActions isDisabled={!pipelinesAPI.pipelinesServer.installed} />}
      getRedirectPath={experimentsBaseRoute}
      overrideChildPadding
      overrideTimeout
      accessDomain="experiments"
      objectType={ProjectObjectType.pipelineExperiment}
    >
      <EnsureAPIAvailability>
        <EnsureCompatiblePipelineServer>
          <PipelineAndVersionContextProvider>
            <GlobalExperimentsTabs tab={tab} />
          </PipelineAndVersionContextProvider>
        </EnsureCompatiblePipelineServer>
      </EnsureAPIAvailability>
    </PipelineCoreApplicationPage>
  );
};

export default GlobalExperiments;
