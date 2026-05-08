import * as React from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { getGenericErrorCode } from '@odh-dashboard/dashboard-foundation-frontend/api/errorUtils';
import UnauthorizedError from '@odh-dashboard/dashboard-foundation-frontend/components/UnauthorizedError';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import PipelineCoreProjectSelector from '@odh-dashboard/pipelines-shared/concepts/pipelines/PipelineCoreProjectSelector';
import NoPipelineServer from '@odh-dashboard/pipelines/concepts/NoPipelineServer';
import { PipelineServerTimedOut, usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

export type PipelineCoreApplicationPageProps = {
  children: React.ReactNode;
  getRedirectPath: (namespace: string) => string;
  overrideChildPadding?: boolean;
  overrideTimeout?: boolean;
  /** Custom domain name for 403 error messages (e.g., "pipeline runs", "artifacts") */
  accessDomain?: string;
  objectType?: ProjectObjectType;
} & Omit<
  React.ComponentProps<typeof ApplicationsPage>,
  'loaded' | 'empty' | 'emptyStatePage' | 'headerContent' | 'provideChildrenPadding'
>;

const PipelineCoreApplicationPage: React.FC<PipelineCoreApplicationPageProps> = ({
  children,
  getRedirectPath,
  overrideChildPadding,
  overrideTimeout = false,
  accessDomain = 'pipelines',
  objectType,
  ...pageProps
}) => {
  const { pipelinesServer, pipelineLoadError } = usePipelinesAPI();

  // Handle 403 errors with a specific message
  const loadErrorPage =
    pipelineLoadError && getGenericErrorCode(pipelineLoadError) === 403 ? (
      <UnauthorizedError accessDomain={accessDomain} />
    ) : undefined;

  return (
    <ApplicationsPage
      {...pageProps}
      loaded={!pipelinesServer.initializing}
      loadError={pipelineLoadError}
      loadErrorPage={loadErrorPage}
      empty={!pipelinesServer.installed}
      emptyStatePage={<NoPipelineServer variant={ButtonVariant.primary} />}
      headerContent={
        <PipelineCoreProjectSelector getRedirectPath={getRedirectPath} objectType={objectType} />
      }
      provideChildrenPadding={!overrideChildPadding}
    >
      {!overrideTimeout && pipelinesServer.timedOut && pipelinesServer.compatible ? (
        <PipelineServerTimedOut />
      ) : (
        children
      )}
    </ApplicationsPage>
  );
};

export default PipelineCoreApplicationPage;
