import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { experimentRecurringRunsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { PipelineCoreDetailsPageComponent } from '@odh-dashboard/pipelines/concepts/content/types';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineRecurringRunDetails from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRecurringRun/PipelineRecurringRunDetails';

const ExperimentPipelineRecurringRunDetails: PipelineCoreDetailsPageComponent = ({
  breadcrumbPath,
}) => {
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();
  return (
    <PipelineRecurringRunDetails
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
    />
  );
};

export default ExperimentPipelineRecurringRunDetails;
