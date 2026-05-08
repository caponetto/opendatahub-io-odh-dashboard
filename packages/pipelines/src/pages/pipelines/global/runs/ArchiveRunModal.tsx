import React from 'react';
import { ListItem, StackItem } from '@patternfly/react-core';
import { BulkActionExpandableSection } from '@odh-dashboard/dashboard-foundation-frontend/components/BulkActionExpandableSection';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { PipelineRunKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { ArchiveModal } from '@odh-dashboard/pipelines/concepts/content/ArchiveModal';
import { PipelineRunTabTitle } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';

interface ArchiveRunModalProps {
  runs: PipelineRunKF[];
  onCancel: () => void;
}

export const ArchiveRunModal: React.FC<ArchiveRunModalProps> = ({ runs, onCancel }) => {
  const isSingleArchiving = runs.length === 1;
  const { api } = usePipelinesAPI();
  const onSubmit = React.useCallback(
    () => Promise.all(runs.map((run) => api.archivePipelineRun({}, run.run_id))),
    [api, runs],
  );

  return (
    <ArchiveModal
      title={`Archiving run${isSingleArchiving ? '' : 's'}?`}
      alertTitle={`Error archiving ${isSingleArchiving ? runs[0].display_name : 'runs'}`}
      confirmMessage={
        isSingleArchiving ? runs[0].display_name.trim() : `Archive ${runs.length} runs`
      }
      onSubmit={onSubmit}
      onCancel={onCancel}
      testId="archive-run-modal"
      whatToArchive="runs"
    >
      {isSingleArchiving ? (
        <StackItem>
          The run will be archived and sent to the <b>{PipelineRunTabTitle.ARCHIVED}</b> tab, where
          it can be restored.
        </StackItem>
      ) : (
        <>
          <StackItem>
            <b>{runs.length}</b> runs will be archived and sent to the{' '}
            <b>{PipelineRunTabTitle.ARCHIVED}</b> tab.
          </StackItem>
          <StackItem>
            <BulkActionExpandableSection title="Selected runs">
              {runs.map((run) => (
                <ListItem key={run.run_id}>{run.display_name}</ListItem>
              ))}
            </BulkActionExpandableSection>
          </StackItem>
        </>
      )}
    </ArchiveModal>
  );
};
