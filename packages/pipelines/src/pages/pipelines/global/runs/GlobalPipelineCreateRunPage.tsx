import React from 'react';
import {
  globalPipelineRecurringRunsRoute,
  globalPipelineRunsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import CreateRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/CreateRunPage';
import { RunTypeOption } from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

export const GlobalPipelineCreateRunPage: BreadcrumbDetailsComponentProps = ({
  breadcrumbPath,
  setHomePath,
}) => {
  const { namespace } = usePipelinesAPI();
  const contextPath = globalPipelineRunsRoute(namespace);

  React.useEffect(() => {
    setHomePath(contextPath);
  }, [setHomePath, contextPath]);

  return (
    <CreateRunPage
      breadcrumbPath={breadcrumbPath}
      contextPath={contextPath}
      runType={RunTypeOption.ONE_TRIGGER}
    />
  );
};

export const GlobalPipelineCreateRecurringRunPagePage: BreadcrumbDetailsComponentProps = ({
  breadcrumbPath,
  setHomePath,
}) => {
  const { namespace } = usePipelinesAPI();
  const contextPath = globalPipelineRecurringRunsRoute(namespace);

  React.useEffect(() => {
    setHomePath(contextPath);
  }, [setHomePath, contextPath]);

  return (
    <CreateRunPage
      breadcrumbPath={breadcrumbPath}
      contextPath={contextPath}
      runType={RunTypeOption.SCHEDULED}
    />
  );
};
