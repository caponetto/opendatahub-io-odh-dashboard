import React from 'react';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { deleteSecret } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import { removeNotebookSecret } from '@odh-dashboard/workbenches-shared/concepts/notebooks/k8s';
import {
  useRelatedNotebooks,
  ConnectedNotebookContext,
} from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';
import { useInferenceServicesForConnection } from '@odh-dashboard/workbenches/pages/useInferenceServicesForConnection';
import ConnectedResourcesDeleteModal from '@odh-dashboard/workbenches/pages/components/ConnectedResourcesDeleteModal';

type Props = {
  namespace: string;
  deleteConnection: Connection;
  onClose: (deleted?: boolean) => void;
};

export const ConnectionsDeleteModal: React.FC<Props> = ({ deleteConnection, onClose }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error>();
  const { notebooks: connectedNotebooks, loaded } = useRelatedNotebooks(
    ConnectedNotebookContext.EXISTING_DATA_CONNECTION,
    deleteConnection.metadata.name,
  );
  const connectedModels = useInferenceServicesForConnection(deleteConnection);

  return (
    <DeleteModal
      title="Delete connection?"
      onClose={onClose}
      submitButtonLabel="Delete"
      onDelete={() => {
        setIsDeleting(true);
        setError(undefined);
        Promise.all(
          connectedNotebooks.map((notebook) =>
            removeNotebookSecret(
              notebook.metadata.name,
              notebook.metadata.namespace,
              deleteConnection.metadata.name,
            ),
          ),
        )
          .then(() =>
            deleteSecret(deleteConnection.metadata.namespace, deleteConnection.metadata.name),
          )
          .then(() => {
            onClose(true);
          })
          .catch((e) => {
            setError(e);
            setIsDeleting(false);
          });
      }}
      deleting={isDeleting}
      error={error}
      deleteName={getDisplayNameFromK8sResource(deleteConnection)}
    >
      The <b>{getDisplayNameFromK8sResource(deleteConnection)}</b> connection will be deleted, and
      its dependent resources will stop working.
      <ConnectedResourcesDeleteModal
        connectedNotebooks={connectedNotebooks}
        connectedModels={connectedModels}
        loaded={loaded}
        namespace={deleteConnection.metadata.namespace}
      />
    </DeleteModal>
  );
};
