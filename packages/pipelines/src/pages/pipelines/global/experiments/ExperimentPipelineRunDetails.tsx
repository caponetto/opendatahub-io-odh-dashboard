import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { Link, useParams } from 'react-router-dom';
import {
  experimentArchivedRunsRoute,
  experimentRunsRoute,
} from '@odh-dashboard/pipelines/routes/experiments';
import PipelineRunDetails from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/PipelineRunDetails';
import { PipelineCoreDetailsPageComponent } from '@odh-dashboard/pipelines/concepts/content/types';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineRunById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRunById';
import { StorageStateKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const ExperimentPipelineRunDetails: PipelineCoreDetailsPageComponent = ({ breadcrumbPath }) => {
  const { runId } = useParams();
  const fetchedRun = usePipelineRunById(runId, true);
  const { experiment } = React.useContext(ExperimentContext);
  const { namespace } = usePipelinesAPI();
  const [run] = fetchedRun;
  const isRunArchived = run?.storage_state === StorageStateKF.ARCHIVED;
  return (
    <PipelineRunDetails
      breadcrumbPath={[
        ...breadcrumbPath,
        <BreadcrumbItem isActive key="experiment" style={{ maxWidth: 300 }}>
          {experiment ? (
            <Link
              to={
                isRunArchived
                  ? experimentArchivedRunsRoute(namespace, experiment.experiment_id)
                  : experimentRunsRoute(namespace, experiment.experiment_id)
              }
            >
              <Truncate content={experiment.display_name} />
            </Link>
          ) : (
            'Loading...'
          )}
        </BreadcrumbItem>,
      ]}
      contextPath={experimentRunsRoute(namespace, experiment?.experiment_id)}
      fetchedRun={fetchedRun}
    />
  );
};

export default ExperimentPipelineRunDetails;
