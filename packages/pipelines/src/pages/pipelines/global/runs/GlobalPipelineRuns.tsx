import * as React from 'react';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { pipelineRunsBaseRoute } from '@odh-dashboard/pipelines/routes/runs';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import {
  runGroupRunsPageDescription,
  pipelineRunsPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/runs/const';
import GlobalPipelineRunsTabs from '@odh-dashboard/pipelines/pages/pipelines/global/runs/GlobalPipelineRunsTabs';
import { PipelineRunType } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';
import PipelineRunVersionsContextProvider from '@odh-dashboard/pipelines/pages/pipelines/global/runs/PipelineRunVersionsContext';
import PipelineRunExperimentsContextProvider from '@odh-dashboard/pipelines/pages/pipelines/global/runs/PipelineRunExperimentsContext';

type GlobalPipelineRunsProps = {
  tab: PipelineRunType;
};

const GlobalPipelineRuns: React.FC<GlobalPipelineRunsProps> = ({ tab }) => {
  const pipelinesAPI = usePipelinesAPI();
  const { namespace } = pipelinesAPI;

  return (
    <PipelineCoreApplicationPage
      title={
        <TitleWithIcon title={pipelineRunsPageTitle} objectType={ProjectObjectType.pipelineRun} />
      }
      description={runGroupRunsPageDescription}
      headerAction={<PipelineServerActions isDisabled={!pipelinesAPI.pipelinesServer.installed} />}
      getRedirectPath={pipelineRunsBaseRoute}
      overrideTimeout
      accessDomain="pipeline runs"
    >
      <EnsureAPIAvailability>
        <EnsureCompatiblePipelineServer>
          <PipelineRunExperimentsContextProvider>
            <PipelineRunVersionsContextProvider>
              <GlobalPipelineRunsTabs basePath={pipelineRunsBaseRoute(namespace)} tab={tab} />
            </PipelineRunVersionsContextProvider>
          </PipelineRunExperimentsContextProvider>
        </EnsureCompatiblePipelineServer>
      </EnsureAPIAvailability>
    </PipelineCoreApplicationPage>
  );
};

export default GlobalPipelineRuns;
