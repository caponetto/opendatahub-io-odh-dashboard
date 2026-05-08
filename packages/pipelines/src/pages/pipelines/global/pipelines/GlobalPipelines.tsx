import * as React from 'react';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { pipelinesBaseRoute } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import {
  pipelinesPageDescription,
  pipelinesPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/pipelines/const';
import PipelineServerActions from '@odh-dashboard/pipelines/concepts/content/PipelineServerActions';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import PipelinesView from '@odh-dashboard/pipelines/pages/pipelines/global/pipelines/PipelinesView';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import PipelineAndVersionContextProvider from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';

const GlobalPipelines: React.FC = () => {
  const pipelinesAPI = usePipelinesAPI();

  // problem is that the container here doesn't show the children when the pipeline fails,
  // so the modal auto-closes (since the EnsureApiAvailability is not longer rendered; so the modal
  // is removed from the DOM)
  // will address this in a future ticket: https://issues.redhat.com/browse/RHOAIENG-27999
  return (
    <div>
      <PipelineCoreApplicationPage
        title={<TitleWithIcon title={pipelinesPageTitle} objectType={ProjectObjectType.pipeline} />}
        description={pipelinesPageDescription}
        headerAction={
          <PipelineServerActions isDisabled={!pipelinesAPI.pipelinesServer.installed} />
        }
        getRedirectPath={pipelinesBaseRoute}
        overrideTimeout
      >
        <EnsureAPIAvailability>
          <EnsureCompatiblePipelineServer>
            <PipelineAndVersionContextProvider>
              <PipelinesView />
            </PipelineAndVersionContextProvider>
          </EnsureCompatiblePipelineServer>
        </EnsureAPIAvailability>
      </PipelineCoreApplicationPage>
    </div>
  );
};

export default GlobalPipelines;
