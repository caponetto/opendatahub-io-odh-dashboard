import React from 'react';
import { Tooltip, Icon, Skeleton } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router';
import { experimentRunDetailsRoute } from '@odh-dashboard/pipelines/routes/experiments';
import usePipelineRunById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRunById';
import { useGetPipelineRunContextByExecution } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useGetMlmdContextByExecution';

type ExperimentPipelineRunLinkProps = {
  executionId: number | undefined;
  namespace: string;
};

const ExperimentPipelineRunLink: React.FC<ExperimentPipelineRunLinkProps> = ({
  executionId,
  namespace,
}) => {
  const [context, contextLoaded, contextError] = useGetPipelineRunContextByExecution(executionId);
  const [run, runLoaded, runError] = usePipelineRunById(context?.getName());

  if (runError || contextError) {
    return (
      <Tooltip content={runError?.message || contextError?.message}>
        <Icon status="danger" data-testid="error-icon">
          <ExclamationCircleIcon />
        </Icon>
      </Tooltip>
    );
  }

  if (!runLoaded || !contextLoaded) {
    return <Skeleton />;
  }

  if (run) {
    return (
      <Link to={experimentRunDetailsRoute(namespace, run.experiment_id, run.run_id)}>
        {`runs/details/${run.run_id}`}
      </Link>
    );
  }

  if (context?.getName()) {
    return `runs/details/${context.getName()}`;
  }

  return 'Unknown';
};

export default ExperimentPipelineRunLink;
