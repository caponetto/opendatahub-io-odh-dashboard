import * as React from 'react';
import { ListItem, StackItem, Stack } from '@patternfly/react-core';
import { BulkActionExpandableSection } from '@odh-dashboard/dashboard-foundation-frontend/components/BulkActionExpandableSection';
import { RestoreModal } from '@odh-dashboard/pipelines/concepts/content/RestoreModal';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { ExperimentListTabTitle } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/const';
import { PipelineRunTabTitle } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';

interface RestoreExperimentModalProps {
  experiments: ExperimentKF[];
  onCancel: () => void;
}

export const RestoreExperimentModal: React.FC<RestoreExperimentModalProps> = ({
  experiments,
  onCancel,
}) => {
  const isSingleRestoring = experiments.length === 1;

  const { api } = usePipelinesAPI();
  const onSubmit = React.useCallback(
    () =>
      Promise.all(
        experiments.map((experiment) => api.unarchiveExperiment({}, experiment.experiment_id)),
      ),
    [api, experiments],
  );
  return (
    <RestoreModal
      onCancel={onCancel}
      onSubmit={onSubmit}
      title={`Restore experiment${isSingleRestoring ? '' : 's'}?`}
      testId="restore-experiment-modal"
      what="experiment"
      alertTitle={`Error restoring ${
        isSingleRestoring ? experiments[0].display_name : 'experiments'
      }`}
    >
      {isSingleRestoring ? (
        <>
          <b>{experiments[0].display_name}</b> will be restored and returned to the{' '}
          <b>{ExperimentListTabTitle.ACTIVE}</b> tab. Its runs and schedules can be restored from
          the <b>{PipelineRunTabTitle.ARCHIVED}</b> and <b>{PipelineRunTabTitle.SCHEDULES}</b> tabs.
        </>
      ) : (
        <Stack hasGutter>
          <StackItem>
            <b>{experiments.length}</b> experiments will be restored and returned to the{' '}
            <b>{ExperimentListTabTitle.ACTIVE}</b> tab. Their runs can be restored from the{' '}
            <b>{PipelineRunTabTitle.ARCHIVED}</b> page.
          </StackItem>
          <StackItem>
            <BulkActionExpandableSection title="Selected experiments">
              {experiments.map((experiment) => (
                <ListItem key={experiment.experiment_id}>{experiment.display_name}</ListItem>
              ))}
            </BulkActionExpandableSection>
          </StackItem>
        </Stack>
      )}
    </RestoreModal>
  );
};
