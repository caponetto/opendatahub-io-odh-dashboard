import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
  BreadcrumbItem,
  Truncate,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { compareRunsRoute, createRunRoute } from '@odh-dashboard/pipelines/routes/runs';
import { experimentRunsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { CompareRunsSearchParam, PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelineActiveRunsTable } from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/usePipelineRunTable';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import { EmptyRunsState } from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/EmptyRunsState';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import { ManageRunsTable } from './ManageRunsTable';

const ManageRunsPage: React.FC<PathProps> = ({ breadcrumbPath }) => {
  const [searchParams] = useSearchParams();
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();
  const [[{ items: runs, totalSize }, loaded, error], { initialLoaded, ...tableProps }] =
    usePipelineActiveRunsTable({ experimentId: experiment?.experiment_id });
  const selectedRunIds = searchParams.get(CompareRunsSearchParam.RUNS)?.split(',') ?? [];

  if (error) {
    return (
      <Bullseye>
        <EmptyState
          headingLevel="h2"
          icon={ExclamationCircleIcon}
          titleText="There was an issue loading runs"
        >
          <EmptyStateBody>{error.message}</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  if (!loaded && !initialLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (loaded && totalSize === 0 && !tableProps.filter) {
    return (
      <EmptyRunsState
        createRunRoute={createRunRoute(namespace, experiment?.experiment_id)}
        dataTestId="runs-empty-state"
      />
    );
  }

  return (
    <ApplicationsPage
      title="Manage runs"
      loaded
      empty={!runs}
      breadcrumb={
        <PipelineContextBreadcrumb dataTestId="manage-runs-page-breadcrumb">
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
          <BreadcrumbItem key="compare-runs">
            <Link to={compareRunsRoute(namespace, selectedRunIds, experiment?.experiment_id)}>
              Compare runs
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem key="manage-runs">Manage runs</BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      provideChildrenPadding
      removeChildrenTopPadding
    >
      <ManageRunsTable
        runs={runs}
        selectedRunIds={selectedRunIds}
        loading={!loaded}
        totalSize={totalSize}
        {...tableProps}
      />
    </ApplicationsPage>
  );
};

export default ManageRunsPage;
