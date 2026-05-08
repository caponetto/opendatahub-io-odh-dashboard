import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Spinner,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import createUsePipelineTable from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import { useActiveExperiments } from '@odh-dashboard/pipelines/concepts/apiHooks/useExperiments';
import ActiveExperimentTable from '@odh-dashboard/pipelines/concepts/content/tables/experiment/ActiveExperimentTable';
import CreateExperimentButton from '@odh-dashboard/pipelines/concepts/content/experiment/CreateExperimentButton';
import ExperimentLoadingError from '@odh-dashboard/pipelines/concepts/content/experiments/ExperimentLoadingError';

const ActiveExperimentsList: React.FC = () => {
  const [[{ items: experiments, totalSize }, loaded, error], { initialLoaded, ...tableProps }] =
    createUsePipelineTable(useActiveExperiments)();

  if (error) {
    return <ExperimentLoadingError error={error} />;
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
      <EmptyState
        headingLevel="h4"
        icon={PlusCircleIcon}
        titleText="No active experiments"
        data-testid="global-no-experiments"
      >
        <EmptyStateBody>Click the button below to create a new active experiment.</EmptyStateBody>
        <EmptyStateFooter>
          <CreateExperimentButton />
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return (
    <ActiveExperimentTable
      experiments={experiments}
      loading={!loaded}
      totalSize={totalSize}
      {...tableProps}
    />
  );
};
export default ActiveExperimentsList;
