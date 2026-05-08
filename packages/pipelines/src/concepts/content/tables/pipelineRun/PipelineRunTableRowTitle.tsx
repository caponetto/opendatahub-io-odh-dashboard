import React from 'react';
import { Link } from 'react-router-dom';
import { TableText } from '@patternfly/react-table';
import { TableRowTitleDescription } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { runDetailsRoute } from '@odh-dashboard/pipelines/routes/runs';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineRunTypeLabel from '@odh-dashboard/pipelines/concepts/content/PipelineRunTypeLabel';
import PipelineRecurringRunReferenceName from '@odh-dashboard/pipelines/concepts/content/PipelineRecurringRunReferenceName';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';

type PipelineRunTableRowTitleProps = {
  run: PipelineRunKF;
  isModelRegistered?: boolean;
};

const PipelineRunTableRowTitle: React.FC<PipelineRunTableRowTitleProps> = ({
  run,
  isModelRegistered,
}) => {
  const { namespace } = usePipelinesAPI();
  const { experiment } = React.useContext(ExperimentContext);

  return (
    <TableRowTitleDescription
      title={
        <Link to={runDetailsRoute(namespace, run.run_id, experiment?.experiment_id)}>
          <TableText wrapModifier="truncate">{run.display_name}</TableText>
        </Link>
      }
      subtitle={
        <PipelineRecurringRunReferenceName
          runName={run.display_name}
          recurringRunId={run.recurring_run_id}
        />
      }
      description={run.description}
      descriptionAsMarkdown
      label={<PipelineRunTypeLabel run={run} isCompact isModelRegistered={isModelRegistered} />}
    />
  );
};
export default PipelineRunTableRowTitle;
