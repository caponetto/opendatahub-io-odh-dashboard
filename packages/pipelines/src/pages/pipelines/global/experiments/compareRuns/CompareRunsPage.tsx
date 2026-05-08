import React from 'react';
import { BreadcrumbItem, Stack, StackItem, Truncate } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { experimentRunsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { useCompareRuns } from '@odh-dashboard/pipelines/concepts/content/compareRuns/CompareRunsContext';
import { CompareRunsInvalidRunCount } from '@odh-dashboard/pipelines/concepts/content/compareRuns/CompareRunInvalidRunCount';
import CompareRunsRunList from '@odh-dashboard/pipelines/concepts/content/compareRuns/CompareRunsRunList';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import { CompareRunMetricsSection } from './CompareRunsMetricsSection';
import { CompareRunParamsSection } from './CompareRunParamsSection';

const CompareRunsPage: React.FC<PathProps> = ({ breadcrumbPath }) => {
  const { runs, loaded } = useCompareRuns();
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();

  if (loaded && (runs.length > 10 || runs.length === 0)) {
    return <CompareRunsInvalidRunCount runs={runs} />;
  }

  return (
    <ApplicationsPage
      data-testid="compare-runs-page"
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          {experiment ? (
            <BreadcrumbItem key="experiment">
              {experiment.display_name ? (
                <Link to={experimentRunsRoute(namespace, experiment.experiment_id)}>
                  <Truncate content={experiment.display_name} />
                </Link>
              ) : (
                'Loading...'
              )}
            </BreadcrumbItem>
          ) : null}
          <BreadcrumbItem isActive>Compare runs</BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      provideChildrenPadding
      loaded={loaded}
      empty={false}
      noHeader
    >
      <Stack hasGutter>
        <StackItem>
          <CompareRunsRunList />
        </StackItem>

        <StackItem>
          <CompareRunParamsSection />
        </StackItem>

        <StackItem>
          <CompareRunMetricsSection />
        </StackItem>
      </Stack>
    </ApplicationsPage>
  );
};

export default CompareRunsPage;
