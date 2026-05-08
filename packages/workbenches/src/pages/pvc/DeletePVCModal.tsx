import * as React from 'react';
import { PersistentVolumeClaimKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { deletePvc } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pvcs';
import { removeNotebookPVC } from '@odh-dashboard/workbenches-shared/concepts/notebooks/k8s';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import {
  useRelatedNotebooks,
  ConnectedNotebookContext,
} from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';
import ConnectedResourcesDeleteModal from '@odh-dashboard/workbenches/pages/components/ConnectedResourcesDeleteModal';
import { useInferenceServicesForConnection } from '@odh-dashboard/workbenches/pages/useInferenceServicesForConnection';

type DeletePVCModalProps = {
  pvcToDelete: PersistentVolumeClaimKind;
  onClose: (deleted: boolean) => void;
};

const DeletePVCModal: React.FC<DeletePVCModalProps> = ({ pvcToDelete, onClose }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const { notebooks: connectedNotebooks, loaded: notebookLoaded } = useRelatedNotebooks(
    ConnectedNotebookContext.EXISTING_PVC,
    pvcToDelete.metadata.name,
  );
  const connectedModels = useInferenceServicesForConnection(pvcToDelete);

  const onBeforeClose = (deleted: boolean) => {
    onClose(deleted);
    setIsDeleting(false);
    setError(undefined);
  };

  const displayName = getDisplayNameFromK8sResource(pvcToDelete);

  return (
    <DeleteModal
      title="Delete storage?"
      onClose={() => onBeforeClose(false)}
      submitButtonLabel="Delete storage"
      onDelete={() => {
        const { name, namespace } = pvcToDelete.metadata;
        setIsDeleting(true);
        Promise.all(
          connectedNotebooks.map((notebook) =>
            removeNotebookPVC(notebook.metadata.name, namespace, name),
          ),
        )
          .then(() =>
            deletePvc(name, namespace).then(() => {
              onBeforeClose(true);
            }),
          )
          .catch((e) => {
            setError(e);
            setIsDeleting(false);
          });
      }}
      deleting={isDeleting}
      error={error}
      deleteName={displayName}
    >
      The <b>{getDisplayNameFromK8sResource(pvcToDelete)}</b> storage will be deleted, and its
      dependent resources will stop working.
      <ConnectedResourcesDeleteModal
        connectedNotebooks={connectedNotebooks}
        connectedModels={connectedModels}
        loaded={notebookLoaded}
        namespace={pvcToDelete.metadata.namespace}
      />
    </DeleteModal>
  );
};

export default DeletePVCModal;
