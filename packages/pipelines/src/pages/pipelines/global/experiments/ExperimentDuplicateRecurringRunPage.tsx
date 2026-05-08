import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { experimentRecurringRunsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { recurringRunDetailsRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import DuplicateRecurringRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/DuplicateRecurringRunPage';

const ExperimentDuplicateRecurringRunPage: React.FC<PathProps> = ({ breadcrumbPath }) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();

  return (
    <DuplicateRecurringRunPage
      breadcrumbPath={[
        ...breadcrumbPath,
        <BreadcrumbItem isActive key="experiment" style={{ maxWidth: 300 }}>
          {experiment ? (
            <Link to={experimentRecurringRunsRoute(namespace, experiment.experiment_id)}>
              <Truncate content={experiment.display_name} />
            </Link>
          ) : (
            'Loading...'
          )}
        </BreadcrumbItem>,
      ]}
      contextPath={experimentRecurringRunsRoute(namespace, experiment?.experiment_id)}
      contextExperiment={experiment}
      detailsRedirect={(recurringRunId) =>
        recurringRunDetailsRoute(namespace, recurringRunId, experiment?.experiment_id)
      }
    />
  );
};

export default ExperimentDuplicateRecurringRunPage;
