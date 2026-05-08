import { PersistentVolumeClaimKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  useRelatedNotebooks,
  ConnectedNotebookContext,
} from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';
import { getNotebookPVCMountPathMap } from '@odh-dashboard/workbenches/pages/notebook/utils';

const useIsRootVolume = (pvc: PersistentVolumeClaimKind): boolean => {
  const pvcName = pvc.metadata.name;
  const { notebooks, loaded, error } = useRelatedNotebooks(
    ConnectedNotebookContext.EXISTING_PVC,
    pvcName,
  );
  if (!loaded || error) {
    return false;
  }

  return notebooks.some((notebook) => getNotebookPVCMountPathMap(notebook)[pvcName] === '/');
};

export default useIsRootVolume;
