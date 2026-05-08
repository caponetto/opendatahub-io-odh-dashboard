import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import {
  experimentRecurringRunsRoute,
  experimentRunsRoute,
} from '@odh-dashboard/pipelines/routes/experiments';
import CreateRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/CreateRunPage';
import { RunTypeOption } from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import {
  PathProps,
  PipelineCoreDetailsPageComponent,
} from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';

const ExperimentCreateRunPageInner: React.FC<PathProps & { runType: RunTypeOption }> = ({
  breadcrumbPath,
  runType,
}) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();

  const redirectLink =
    runType === RunTypeOption.SCHEDULED
      ? experimentRecurringRunsRoute(namespace, experiment?.experiment_id)
      : experimentRunsRoute(namespace, experiment?.experiment_id);
  return (
    <CreateRunPage
      breadcrumbPath={[
        ...breadcrumbPath,
        <BreadcrumbItem isActive key="experiment" style={{ maxWidth: 300 }}>
          {experiment ? (
            <Link to={redirectLink}>
              <Truncate content={experiment.display_name} />
            </Link>
          ) : (
            'Loading...'
          )}
        </BreadcrumbItem>,
      ]}
      contextPath={redirectLink}
      runType={runType}
      contextExperiment={experiment}
    />
  );
};

export const ExperimentCreateRunPage: PipelineCoreDetailsPageComponent = (props) => (
  <ExperimentCreateRunPageInner runType={RunTypeOption.ONE_TRIGGER} {...props} />
);

export const ExperimentCreateSchedulePage: PipelineCoreDetailsPageComponent = (props) => (
  <ExperimentCreateRunPageInner runType={RunTypeOption.SCHEDULED} {...props} />
);
