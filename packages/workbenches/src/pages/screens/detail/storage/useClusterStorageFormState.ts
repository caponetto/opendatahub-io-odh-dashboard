import React from 'react';
import {
  NotebookKind,
  PersistentVolumeClaimKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getNotebookPVCMountPathMap } from '@odh-dashboard/workbenches/pages/notebook/utils';
import { ClusterStorageNotebookSelection } from '@odh-dashboard/workbenches/pages/types';

const useClusterStorageFormState = (
  connectedNotebooks: NotebookKind[],
  loaded: boolean,
  existingPvc?: PersistentVolumeClaimKind,
): {
  notebookData: ClusterStorageNotebookSelection[];
  setNotebookData: React.Dispatch<React.SetStateAction<ClusterStorageNotebookSelection[]>>;
} => {
  const [notebookData, setNotebookData] = React.useState<ClusterStorageNotebookSelection[]>([]);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!initializedRef.current && loaded) {
      initializedRef.current = true;
      const addData = connectedNotebooks.map((connectedNotebook) => ({
        name: connectedNotebook.metadata.name,
        notebookDisplayName: connectedNotebook.metadata.annotations?.['openshift.io/display-name'],
        mountPath: {
          value: existingPvc
            ? getNotebookPVCMountPathMap(connectedNotebook)[existingPvc.metadata.name]
            : '',
          error: '',
        },
        existingPvc: true,
        isUpdatedValue: false,
      }));
      setNotebookData(addData);
    }
  }, [connectedNotebooks, loaded, existingPvc]);

  return { notebookData, setNotebookData };
};

export default useClusterStorageFormState;
