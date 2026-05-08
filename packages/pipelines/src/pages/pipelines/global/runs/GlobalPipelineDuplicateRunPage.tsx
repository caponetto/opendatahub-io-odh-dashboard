import React from 'react';
import {
  globalPipelineRunDetailsRoute,
  globalPipelineRunsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import DuplicateRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/DuplicateRunPage';

const GlobalPipelineDuplicateRunPage: BreadcrumbDetailsComponentProps = ({ breadcrumbPath }) => {
  const { namespace } = usePipelinesAPI();
  const contextPath = globalPipelineRunsRoute(namespace);

  return (
    <DuplicateRunPage
      breadcrumbPath={breadcrumbPath}
      contextPath={contextPath}
      detailsRedirect={(runId) => globalPipelineRunDetailsRoute(namespace, runId)}
    />
  );
};

export default GlobalPipelineDuplicateRunPage;
