import * as React from 'react';
import { ListItem, Stack, StackItem } from '@patternfly/react-core';
import { BulkActionExpandableSection } from '@odh-dashboard/dashboard-foundation-frontend/components/BulkActionExpandableSection';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { RestoreModal } from '@odh-dashboard/pipelines/concepts/content/RestoreModal';
import { PipelineRunTabTitle } from './types';

interface RestoreRunModalProps {
  runs: PipelineRunKF[];
  onCancel: () => void;
}

export const RestoreRunModal: React.FC<RestoreRunModalProps> = ({ runs, onCancel }) => {
  const isSingleRestoring = runs.length === 1;
  const { api } = usePipelinesAPI();
  const onSubmit = React.useCallback(
    () => Promise.all(runs.map((run) => api.unarchivePipelineRun({}, run.run_id))),
    [api, runs],
  );
  return (
    <RestoreModal
      title={`Restore run${isSingleRestoring ? '' : 's'}?`}
      onCancel={onCancel}
      onSubmit={onSubmit}
      testId="restore-run-modal"
      what="run"
      alertTitle={`Error restoring ${isSingleRestoring ? runs[0].display_name : 'runs'}`}
    >
      {isSingleRestoring ? (
        <>
          <b>{runs[0].display_name}</b> will be restored and returned to the{' '}
          <b>{PipelineRunTabTitle.ACTIVE}</b> tab.
        </>
      ) : (
        <Stack hasGutter>
          <StackItem>
            <b>{runs.length}</b> runs will be restored and returned to the{' '}
            <b>{PipelineRunTabTitle.ACTIVE}</b> tab.
          </StackItem>
          <StackItem>
            <BulkActionExpandableSection title="Selected runs">
              {runs.map((run) => (
                <ListItem key={run.run_id}>{run.display_name}</ListItem>
              ))}
            </BulkActionExpandableSection>
          </StackItem>
        </Stack>
      )}
    </RestoreModal>
  );
};
