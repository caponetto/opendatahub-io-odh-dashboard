import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { executionsBaseRoute } from '@odh-dashboard/pipelines/routes/executions';
import {
  MlmdListContextProvider,
  usePipelinesAPI,
} from '@odh-dashboard/pipelines/concepts/context';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import {
  executionsPageDescription,
  executionsPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/const';
import ExecutionsList from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/ExecutionsList';

const GlobalExecutions: React.FC = () => {
  const pipelinesAPI = usePipelinesAPI();

  return (
    <PipelineCoreApplicationPage
      title={
        <TitleWithIcon
          title={executionsPageTitle}
          objectType={ProjectObjectType.pipelineExecution}
        />
      }
      description={executionsPageDescription}
      headerAction={<PipelineServerActions isDisabled={!pipelinesAPI.pipelinesServer.installed} />}
      getRedirectPath={executionsBaseRoute}
      overrideChildPadding
      overrideTimeout
      accessDomain="executions"
    >
      <EnsureAPIAvailability>
        <EnsureCompatiblePipelineServer>
          <MlmdListContextProvider>
            <PageSection hasBodyWrapper={false} isFilled>
              <ExecutionsList />
            </PageSection>
          </MlmdListContextProvider>
        </EnsureCompatiblePipelineServer>
      </EnsureAPIAvailability>
    </PipelineCoreApplicationPage>
  );
};

export default GlobalExecutions;
