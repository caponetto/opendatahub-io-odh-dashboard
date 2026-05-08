import * as React from 'react';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { deleteServer } from '@odh-dashboard/pipelines/concepts/utils';
import { getPipelineServerName } from '@odh-dashboard/pipelines/concepts/context/PipelinesContext';

type DeletePipelineServerModalProps = {
  onClose: (deleted: boolean) => void;
  removeConfirmation?: boolean;
};

const eventName = 'Pipeline Server Deleted';
const DeletePipelineServerModal: React.FC<DeletePipelineServerModalProps> = ({
  onClose,
  removeConfirmation = false,
}) => {
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const { project, namespace, pipelinesServer } = usePipelinesAPI();

  const onBeforeClose = (deleted: boolean) => {
    onClose(deleted);
  };

  const deleteName = getPipelineServerName(project);

  return (
    <DeleteModal
      removeConfirmation={removeConfirmation}
      title="Delete pipeline server?"
      onClose={() => {
        onBeforeClose(false);
      }}
      deleting={deleting}
      error={error}
      onDelete={() => {
        setDeleting(true);
        deleteServer(namespace, pipelinesServer.name)
          .then(() => {
            onBeforeClose(true);
            fireFormTrackingEvent(eventName, {
              outcome: TrackingOutcome.submit,
              success: true,
            });
          })
          .catch((e) => {
            onBeforeClose(false);
            setError(e);
            fireFormTrackingEvent(eventName, {
              outcome: TrackingOutcome.submit,
              success: false,
              error: e,
            });
          });
      }}
      submitButtonLabel="Delete"
      deleteName={deleteName}
    >
      The <b>{deleteName}</b> and all of its pipelines and runs will be deleted from{' '}
      <b>{deleteName}</b>. You will not be able to create new pipelines or pipeline runs until you
      create a new pipeline server.
    </DeleteModal>
  );
};

export default DeletePipelineServerModal;
