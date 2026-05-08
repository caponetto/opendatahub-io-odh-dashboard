import React from 'react';
import { globalPipelineRecurringRunsRoute } from '@odh-dashboard/pipelines/routes/runs';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineRecurringRunDetails from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRecurringRun/PipelineRecurringRunDetails';

const GlobalPipelineRecurringRunDetails: BreadcrumbDetailsComponentProps = ({
  breadcrumbPath,
  setHomePath,
}) => {
  const { namespace } = usePipelinesAPI();
  const contextPath = globalPipelineRecurringRunsRoute(namespace);

  React.useEffect(() => {
    setHomePath(contextPath);
  }, [setHomePath, contextPath]);

  return <PipelineRecurringRunDetails breadcrumbPath={breadcrumbPath} contextPath={contextPath} />;
};

export default GlobalPipelineRecurringRunDetails;
