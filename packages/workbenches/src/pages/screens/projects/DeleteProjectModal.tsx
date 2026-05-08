import * as React from 'react';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { deleteProject } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/projects';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';

type DeleteProjectModalProps = {
  onClose: (deleted: boolean) => void;
  deleteData: ProjectKind;
};

const deleteProjectEventType = 'Project Deleted';
const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ deleteData, onClose }) => {
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const onBeforeClose = (deleted: boolean) => {
    if (!deleted) {
      fireFormTrackingEvent(deleteProjectEventType, { outcome: TrackingOutcome.cancel });
    } else {
      fireFormTrackingEvent(deleteProjectEventType, {
        outcome: TrackingOutcome.submit,
        success: true,
      });
    }
    onClose(deleted);
    setDeleting(false);
    setError(undefined);
  };

  const displayName = getDisplayNameFromK8sResource(deleteData);

  return (
    <DeleteModal
      title="Delete project?"
      onClose={() => onBeforeClose(false)}
      deleting={deleting}
      submitButtonLabel="Delete project"
      onDelete={() => {
        setDeleting(true);
        deleteProject(deleteData.metadata.name)
          .then(() => onBeforeClose(true))
          .catch((e) => {
            fireFormTrackingEvent(deleteProjectEventType, {
              outcome: TrackingOutcome.submit,
              success: false,
              error: e,
            });
            setError(e);
            setDeleting(false);
          });
      }}
      deleteName={displayName}
      error={error}
    >
      This action cannot be undone. It will destroy all workbenches, storages, connections and other
      resources in <strong>{displayName}</strong>.
    </DeleteModal>
  );
};

export default DeleteProjectModal;
