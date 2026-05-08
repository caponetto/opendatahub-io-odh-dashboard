import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import TruncatedText from '@odh-dashboard/dashboard-foundation-frontend/components/TruncatedText';
import type { MlflowExperimentData } from '@odh-dashboard/mlflow-shared/concepts/mlflow/types';
import { mlflowExperimentRoute } from '@odh-dashboard/mlflow-shared/concepts/mlflow/routes';
import { PipelineRecurringRunKF, PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { NoRunContent } from '@odh-dashboard/pipelines/concepts/content/tables/renderUtils';
import { getMlflowExperimentNameFromRun } from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/utils';
import { isPipelineRun } from '@odh-dashboard/pipelines/concepts/content/utils';

type PipelineRunTableRowMlflowExperimentProps = {
  run: PipelineRunKF | PipelineRecurringRunKF;
  mlflow: MlflowExperimentData;
};

const PipelineRunTableRowMlflowExperiment: React.FC<PipelineRunTableRowMlflowExperimentProps> = ({
  run,
  mlflow,
}) => {
  const { namespace } = usePipelinesAPI();

  const experimentName = getMlflowExperimentNameFromRun(run);
  const experimentIdFromOutput = isPipelineRun(run)
    ? run.plugins_output?.mlflow?.entries.experiment_id?.value
    : undefined;
  const experimentId =
    experimentIdFromOutput ??
    (experimentName ? mlflow.experiments.find((e) => e.name === experimentName)?.id : undefined);

  if (!experimentName) {
    return <NoRunContent />;
  }

  if (!experimentIdFromOutput && !mlflow.loaded) {
    return <Skeleton data-testid="mlflow-experiment-loading" />;
  }

  if (experimentId && typeof experimentId === 'string') {
    return (
      <Link
        to={mlflowExperimentRoute(experimentId, namespace)}
        data-testid="mlflow-experiment-link"
      >
        <TruncatedText content={experimentName} maxLines={1} />
      </Link>
    );
  }

  return <TruncatedText content={experimentName} maxLines={1} />;
};

export default PipelineRunTableRowMlflowExperiment;
