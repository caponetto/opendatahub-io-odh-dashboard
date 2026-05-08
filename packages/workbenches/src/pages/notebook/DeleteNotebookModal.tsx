import * as React from 'react';
import type { SecretRef, ConfigMapRef } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { K8sStatus } from '@odh-dashboard/k8s-browser';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  DATA_CONNECTION_PREFIX,
  deleteSecret,
  isGeneratedSecretName,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import {
  deleteConfigMap,
  isGeneratedConfigMapName,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/configMaps';
import { deleteNotebook } from '@odh-dashboard/workbenches-shared/concepts/notebooks/k8s';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { getEnvFromList } from '@odh-dashboard/workbenches/pages/pvc/utils';

type DeleteNotebookModalProps = {
  notebook: NotebookKind;
  onClose: (deleted: boolean) => void;
};

const DeleteNotebookModal: React.FC<DeleteNotebookModalProps> = ({ notebook, onClose }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const onBeforeClose = (deleted: boolean) => {
    onClose(deleted);
    setIsDeleting(false);
    setError(undefined);
  };

  const displayName = getDisplayNameFromK8sResource(notebook);

  return (
    <DeleteModal
      title="Delete workbench?"
      onClose={() => onBeforeClose(false)}
      submitButtonLabel="Delete workbench"
      onDelete={() => {
        setIsDeleting(true);

        const nonDataConnectionVariables = getEnvFromList(notebook).filter(
          (envFrom) => !envFrom.secretRef?.name.includes(DATA_CONNECTION_PREFIX),
        );
        const configMapNames = nonDataConnectionVariables
          .filter(
            (envName): envName is ConfigMapRef =>
              !!envName.configMapRef && isGeneratedConfigMapName(envName.configMapRef.name),
          )
          .map((data) => data.configMapRef.name);
        const secretNames = nonDataConnectionVariables
          .filter(
            (envName): envName is SecretRef =>
              !!envName.secretRef && isGeneratedSecretName(envName.secretRef.name),
          )
          .map((data) => data.secretRef.name);

        const { namespace } = notebook.metadata;

        const resourcesToDelete: Promise<K8sStatus>[] = [
          deleteNotebook(notebook.metadata.name, namespace),
          ...secretNames.map((name) => deleteSecret(namespace, name)),
          ...configMapNames.map((name) => deleteConfigMap(namespace, name)),
        ];
        Promise.all(resourcesToDelete)
          .then(() => {
            onBeforeClose(true);
          })
          .catch((e) => {
            setError(e);
            setIsDeleting(false);
          });
      }}
      deleting={isDeleting}
      error={error}
      deleteName={displayName}
    >
      This action cannot be undone.
    </DeleteModal>
  );
};

export default DeleteNotebookModal;
