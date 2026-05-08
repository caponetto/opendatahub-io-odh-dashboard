import React from 'react';

import { Alert, AlertActionCloseButton, FormSection } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import { createRecurringRunRoute, createRunRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PipelineRunTabTitle } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';
import {
  CreateRunPageSections,
  runPageSectionTitles,
} from '@odh-dashboard/pipelines/concepts/content/createRun/const';
import {
  RunFormData,
  RunTypeOption,
} from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';

interface RunTypeSectionProps {
  data: RunFormData;
  isDuplicated: boolean;
}

export const RunTypeSection: React.FC<RunTypeSectionProps> = ({ data, isDuplicated }) => {
  const { namespace } = usePipelinesAPI();
  const { experiment } = React.useContext(ExperimentContext);
  const [isAlertOpen, setIsAlertOpen] = React.useState(true);

  let runTypeValue = 'Run once immediately after creation';
  let alertTitle = (
    <>
      To create a schedule that executes recurring runs,{' '}
      <Link
        to={createRecurringRunRoute(namespace, experiment?.experiment_id)}
        state={{
          locationData: data,
        }}
        data-testid="run-type-section-alert-link"
        replace
      >
        go to the {PipelineRunTabTitle.SCHEDULES} tab
      </Link>
      .
    </>
  );

  if (data.runType.type === RunTypeOption.SCHEDULED) {
    runTypeValue = 'Schedule recurring run';
    alertTitle = (
      <>
        To create a non-recurring run,{' '}
        <Link
          to={createRunRoute(namespace, experiment?.experiment_id)}
          state={{
            locationData: data,
          }}
          data-testid="run-type-section-alert-link"
          replace
        >
          go to the {PipelineRunTabTitle.ACTIVE} tab
        </Link>
        .
      </>
    );
  }

  return (
    <FormSection
      id={CreateRunPageSections.RUN_TYPE}
      title={runPageSectionTitles[CreateRunPageSections.RUN_TYPE]}
    >
      {runTypeValue}

      {isAlertOpen && !isDuplicated && (
        <Alert
          isInline
          variant="info"
          title={alertTitle}
          actionClose={<AlertActionCloseButton onClose={() => setIsAlertOpen(false)} />}
        />
      )}
    </FormSection>
  );
};
