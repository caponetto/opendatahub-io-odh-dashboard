import * as React from 'react';
import { ActionsColumn, TableText, Td, Tr } from '@patternfly/react-table';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  TableRowTitleDescription,
  CheckboxTd,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import type { MlflowExperimentData } from '@odh-dashboard/mlflow-shared/concepts/mlflow/types';
import {
  duplicateRecurringRunRoute,
  globalPipelineRecurringRunsRoute,
  recurringRunDetailsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import { PipelineRecurringRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineRunVersionInfo from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineRunVersionInfo';
import { PipelineVersionLink } from '@odh-dashboard/pipelines/concepts/content/PipelineVersionLink';
import {
  RecurringRunCreated,
  RecurringRunScheduled,
  RecurringRunStatus,
  RecurringRunTrigger,
} from '@odh-dashboard/pipelines/concepts/content/tables/renderUtils';
import PipelineRunTableRowExperiment from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/PipelineRunTableRowExperiment';
import PipelineRunTableRowMlflowExperiment from '@odh-dashboard/pipelines/concepts/content/tables/pipelineRun/PipelineRunTableRowMlflowExperiment';
import usePipelineRunExperimentInfo from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineRunExperimentInfo';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';
import {
  FilterOptions,
  LEGACY_EXPERIMENT_FILTER_PARAM,
} from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineFilter';

type PipelineRecurringRunTableRowProps = {
  isChecked: boolean;
  refresh: () => void;
  onToggleCheck: () => void;
  onDelete: () => void;
  recurringRun: PipelineRecurringRunKF;
  mlflow: MlflowExperimentData;
};

const PipelineRecurringRunTableRow: React.FC<PipelineRecurringRunTableRowProps> = ({
  isChecked,
  refresh,
  onToggleCheck,
  onDelete,
  recurringRun,
  mlflow,
}) => {
  const navigate = useNavigate();
  const { experiment: contextExperiment } = React.useContext(ExperimentContext);
  const { namespace, api } = usePipelinesAPI();
  const {
    version,
    loaded: isVersionLoaded,
    error: versionError,
  } = usePipelineRunVersionInfo(recurringRun);
  const {
    experiment,
    loaded: isExperimentLoaded,
    error: experimentError,
  } = usePipelineRunExperimentInfo(recurringRun);
  const [searchParams] = useSearchParams();
  const handleRunGroupClick = React.useCallback(() => {
    if (!experiment) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(LEGACY_EXPERIMENT_FILTER_PARAM);
    nextParams.set(FilterOptions.RUN_GROUP, experiment.experiment_id);
    navigate(`${globalPipelineRecurringRunsRoute(namespace)}?${nextParams.toString()}`);
  }, [experiment, namespace, navigate, searchParams]);

  return (
    <Tr>
      <CheckboxTd
        id={recurringRun.recurring_run_id}
        isChecked={isChecked}
        onToggle={onToggleCheck}
      />
      <Td dataLabel="Name">
        <TableRowTitleDescription
          title={
            <Link
              to={recurringRunDetailsRoute(
                namespace,
                recurringRun.recurring_run_id,
                contextExperiment?.experiment_id,
              )}
            >
              <TableText wrapModifier="truncate">{recurringRun.display_name}</TableText>
            </Link>
          }
          description={recurringRun.description}
          descriptionAsMarkdown
        />
      </Td>
      <Td modifier="truncate" dataLabel="Pipeline">
        <PipelineVersionLink version={version} error={versionError} loaded={isVersionLoaded} />
      </Td>
      {mlflow.isAvailable && (
        <Td dataLabel="MLflow experiment">
          <PipelineRunTableRowMlflowExperiment run={recurringRun} mlflow={mlflow} />
        </Td>
      )}
      {!contextExperiment && (
        <Td modifier="truncate" dataLabel="Run group">
          <PipelineRunTableRowExperiment
            experiment={experiment}
            error={experimentError}
            loaded={isExperimentLoaded}
            onClick={experiment ? handleRunGroupClick : undefined}
          />
        </Td>
      )}
      <Td dataLabel="Trigger">
        <RecurringRunTrigger recurringRun={recurringRun} />
      </Td>
      <Td dataLabel="Scheduled">
        <RecurringRunScheduled recurringRun={recurringRun} />
      </Td>
      <Td dataLabel="Status">
        <RecurringRunStatus
          experiment={experiment}
          recurringRun={recurringRun}
          onToggle={(checked) =>
            api
              .updatePipelineRecurringRun({}, recurringRun.recurring_run_id, checked)
              .then(() => refresh())
          }
        />
      </Td>
      <Td dataLabel="Created">
        <RecurringRunCreated recurringRun={recurringRun} />
      </Td>
      <Td isActionCell>
        <ActionsColumn
          items={[
            ...(!version
              ? []
              : [
                  {
                    title: 'Duplicate',
                    onClick: () => {
                      navigate(
                        duplicateRecurringRunRoute(
                          namespace,
                          recurringRun.recurring_run_id,
                          contextExperiment?.experiment_id,
                        ),
                      );
                    },
                  },
                  {
                    isSeparator: true,
                  },
                ]),
            {
              title: 'Delete',
              onClick: () => {
                onDelete();
              },
            },
          ]}
        />
      </Td>
    </Tr>
  );
};

export default PipelineRecurringRunTableRow;
