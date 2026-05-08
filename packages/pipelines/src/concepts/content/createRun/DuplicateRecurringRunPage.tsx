import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { useParams, Link } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import RunPage from '@odh-dashboard/pipelines/concepts/content/createRun/RunPage';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import usePipelineRecurringRunById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRecurringRunById';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import { RunTypeOption } from './types';

type DuplicateRecurringRunPageProps = {
  detailsRedirect: (recurringRunId: string) => string;
  contextExperiment?: ExperimentKF | null;
};

const DuplicateRecurringRunPage: React.FC<PathProps & DuplicateRecurringRunPageProps> = ({
  breadcrumbPath,
  contextPath,
  detailsRedirect,
  ...props
}) => {
  const { recurringRunId } = useParams();
  const [recurringRun, loaded, error] = usePipelineRecurringRunById(recurringRunId);

  return (
    <ApplicationsPage
      title="Duplicate schedule"
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
            {recurringRun ? (
              <Link to={detailsRedirect(recurringRun.recurring_run_id)}>
                <Truncate content={recurringRun.display_name} />
              </Link>
            ) : (
              'Loading...'
            )}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Duplicate schedule</BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      loaded={loaded}
      loadError={error}
      empty={false}
    >
      <RunPage
        duplicateRun={recurringRun}
        contextPath={contextPath}
        runType={RunTypeOption.SCHEDULED}
        testId="duplicate-run-page"
        {...props}
      />
    </ApplicationsPage>
  );
};

export default DuplicateRecurringRunPage;
