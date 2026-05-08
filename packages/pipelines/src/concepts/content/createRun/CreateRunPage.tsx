import * as React from 'react';
import { BreadcrumbItem } from '@patternfly/react-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import RunPage from '@odh-dashboard/pipelines/concepts/content/createRun/RunPage';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { RunTypeOption } from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';

type CreateRunPageProps = {
  runType: RunTypeOption;
  contextExperiment?: ExperimentKF | null;
};

const CreateRunPage: React.FC<PathProps & CreateRunPageProps> = ({
  breadcrumbPath,
  contextPath,
  runType,
  ...props
}) => {
  const title = `Create ${runType === RunTypeOption.SCHEDULED ? 'schedule' : 'run'}`;

  return (
    <ApplicationsPage
      title={title}
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          <BreadcrumbItem isActive>{title}</BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      loaded
      empty={false}
    >
      <RunPage contextPath={contextPath} testId="create-run-page" runType={runType} {...props} />
    </ApplicationsPage>
  );
};

export default CreateRunPage;
