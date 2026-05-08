import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import createUsePipelineTable from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import { useArchivedExperiments } from '@odh-dashboard/pipelines/concepts/apiHooks/useExperiments';
import ArchivedExperimentTable from '@odh-dashboard/pipelines/concepts/content/tables/experiment/ArchivedExperimentTable';
import { ExperimentListTabTitle } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/const';
import ExperimentLoadingError from '@odh-dashboard/pipelines/concepts/content/experiments/ExperimentLoadingError';

const ArchivedExperimentsList: React.FC = () => {
  const [[{ items: experiments, totalSize }, loaded, error], { initialLoaded, ...tableProps }] =
    createUsePipelineTable(useArchivedExperiments)();

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
        icon={CubesIcon}
        titleText="No archived experiments"
        data-testid="global-no-experiments"
      >
        <EmptyStateBody>
          When you are finished with an experiment, you can archive it in the{' '}
          {ExperimentListTabTitle.ACTIVE} tab. You can view the archived experiment here.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <ArchivedExperimentTable
      experiments={experiments}
      loading={!loaded}
      totalSize={totalSize}
      {...tableProps}
    />
  );
};
export default ArchivedExperimentsList;
