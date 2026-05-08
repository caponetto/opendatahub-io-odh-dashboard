import React from 'react';
import {
  globalPipelineRecurringRunDetailsRoute,
  globalPipelineRecurringRunsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import DuplicateRecurringRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/DuplicateRecurringRunPage';

const GlobalPipelineDuplicateRecurringRunPage: BreadcrumbDetailsComponentProps = ({
  breadcrumbPath,
  setHomePath,
}) => {
  const { namespace } = usePipelinesAPI();
  const contextPath = globalPipelineRecurringRunsRoute(namespace);

  React.useEffect(() => {
    setHomePath(contextPath);
  }, [setHomePath, contextPath]);

  return (
    <DuplicateRecurringRunPage
      breadcrumbPath={breadcrumbPath}
      contextPath={contextPath}
      detailsRedirect={(recurringRunId) =>
        globalPipelineRecurringRunDetailsRoute(namespace, recurringRunId)
      }
    />
  );
};

export default GlobalPipelineDuplicateRecurringRunPage;
