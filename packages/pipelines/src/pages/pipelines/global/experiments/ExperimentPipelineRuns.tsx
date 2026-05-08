import * as React from 'react';
import { BreadcrumbItem, Label, Truncate } from '@patternfly/react-core';
import { Outlet } from 'react-router';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { experimentsBaseRoute } from '@odh-dashboard/pipelines/routes/experiments';
import {
  runGroupRunsPageDescription,
  pipelineRunsPageTitle,
} from '@odh-dashboard/pipelines/pages/pipelines/global/runs/const';
import PipelineCoreApplicationPage from '@odh-dashboard/pipelines/pages/pipelines/global/PipelineCoreApplicationPage';
import PipelineRunVersionsContextProvider from '@odh-dashboard/pipelines/pages/pipelines/global/runs/PipelineRunVersionsContext';
import { PipelineCoreDetailsPageComponent } from '@odh-dashboard/pipelines/concepts/content/types';
import {
  ExperimentContext,
  useContextExperimentArchivedOrDeleted,
} from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';

const ExperimentPipelineRuns: PipelineCoreDetailsPageComponent = ({ breadcrumbPath }) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { isExperimentArchived } = useContextExperimentArchivedOrDeleted();

  return (
    <PipelineCoreApplicationPage
      title={
        <TitleWithIcon title={pipelineRunsPageTitle} objectType={ProjectObjectType.pipelineRun} />
      }
      description={runGroupRunsPageDescription}
      getRedirectPath={experimentsBaseRoute}
      overrideChildPadding
      accessDomain="pipeline runs"
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          <BreadcrumbItem>
            <Truncate content={experiment?.display_name || 'Loading...'} />
          </BreadcrumbItem>
          {isExperimentArchived && <Label variant="outline">Archived</Label>}
        </PipelineContextBreadcrumb>
      }
    >
      <PipelineRunVersionsContextProvider>
        <Outlet />
      </PipelineRunVersionsContextProvider>
    </PipelineCoreApplicationPage>
  );
};

export default ExperimentPipelineRuns;
