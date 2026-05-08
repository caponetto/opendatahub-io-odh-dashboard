import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { experimentRunsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { runDetailsRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PathProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import DuplicateRunPage from '@odh-dashboard/pipelines/concepts/content/createRun/DuplicateRunPage';

const ExperimentDuplicateRunPage: React.FC<PathProps> = ({ breadcrumbPath }) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();

  return (
    <DuplicateRunPage
      breadcrumbPath={[
        ...breadcrumbPath,
        <BreadcrumbItem isActive key="experiment" style={{ maxWidth: 300 }}>
          {experiment ? (
            <Link to={experimentRunsRoute(namespace, experiment.experiment_id)}>
              <Truncate content={experiment.display_name} />
            </Link>
          ) : (
            'Loading...'
          )}
        </BreadcrumbItem>,
      ]}
      contextPath={experimentRunsRoute(namespace, experiment?.experiment_id)}
      contextExperiment={experiment}
      detailsRedirect={(runId) => runDetailsRoute(namespace, runId, experiment?.experiment_id)}
    />
  );
};

export default ExperimentDuplicateRunPage;
