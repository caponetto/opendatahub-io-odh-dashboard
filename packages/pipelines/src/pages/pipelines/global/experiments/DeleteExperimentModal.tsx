import * as React from 'react';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

type DeleteExperimentModalProps = {
  experiment: ExperimentKF;
  onCancel: () => void;
};

const DeleteExperimentModal: React.FC<DeleteExperimentModalProps> = ({ experiment, onCancel }) => {
  const [isDeleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const { api, refreshAllAPI } = usePipelinesAPI();
  const eventName = 'Experiment Deleted';

  return (
    <DeleteModal
      title="Delete experiment?"
      onClose={onCancel}
      deleting={isDeleting}
      error={error}
      onDelete={async () => {
        setDeleting(true);
        try {
          await api.deleteExperiment({}, experiment.experiment_id);
          refreshAllAPI();
          setDeleting(false);
          onCancel();
          fireFormTrackingEvent(eventName, {
            outcome: TrackingOutcome.submit,
            success: true,
          });
        } catch (e) {
          if (e instanceof Error) {
            setError(e);
          }
          fireFormTrackingEvent(eventName, {
            outcome: TrackingOutcome.submit,
            success: true,
            error: e instanceof Error ? e.message : 'unknown error',
          });

          setDeleting(false);
        }
      }}
      submitButtonLabel="Delete"
      deleteName={experiment.display_name}
    >
      <b>{experiment.display_name}</b> and all of its resources will be deleted.
    </DeleteModal>
  );
};

export default DeleteExperimentModal;
