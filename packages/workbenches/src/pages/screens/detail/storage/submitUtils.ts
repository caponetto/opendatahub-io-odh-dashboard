import {
  NotebookKind,
  PersistentVolumeClaimKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { NotebookState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';
import { StorageData } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/workbenchStorageTypes';
import {
  attachNotebookPVC,
  removeNotebookPVC,
  restartNotebook,
  updateNotebookPVC,
} from '@odh-dashboard/workbenches-shared/concepts/notebooks/k8s';
import { createPvc, updatePvc } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pvcs';
import { isPvcUpdateRequired, NotebooksChangesResult } from './utils';

export const handleSubmit = async (
  submitData: StorageData,
  restartNotebooks: NotebookState[],
  notebookChangesResult: NotebooksChangesResult,
  namespace: string,
  existingPvc?: PersistentVolumeClaimKind,
  dryRun?: boolean,
): Promise<void> => {
  const promises: Promise<PersistentVolumeClaimKind | NotebookKind>[] = [];
  if (existingPvc) {
    const pvcName = existingPvc.metadata.name;

    // Check if PVC needs to be updated (name, description, size, storageClass)
    if (isPvcUpdateRequired(existingPvc, submitData)) {
      promises.push(updatePvc(submitData, existingPvc, namespace, { dryRun }));
    }

    // Restart notebooks if the PVC size has changed
    if (existingPvc.spec.resources.requests.storage !== submitData.size) {
      restartNotebooks.map((connectedNotebook) =>
        promises.push(
          restartNotebook(connectedNotebook.notebook.metadata.name, namespace, { dryRun }),
        ),
      );
    }

    if (notebookChangesResult.updatedNotebooks.length > 0) {
      promises.push(
        ...notebookChangesResult.updatedNotebooks.map((nM) =>
          updateNotebookPVC(nM.name, namespace, nM.mountPath.value, pvcName, { dryRun }),
        ),
      );
    }

    if (notebookChangesResult.removedNotebooks.length > 0) {
      promises.push(
        ...notebookChangesResult.removedNotebooks.map((nM) =>
          removeNotebookPVC(nM, namespace, pvcName, { dryRun }),
        ),
      );
    }
    if (notebookChangesResult.newNotebooks.length > 0) {
      promises.push(
        ...notebookChangesResult.newNotebooks.map((nM) =>
          attachNotebookPVC(nM.name, namespace, pvcName, nM.mountPath.value, { dryRun }),
        ),
      );
    }
    await Promise.all(promises);
    return;
  }
  const createdPvc = await createPvc(submitData, namespace, { dryRun });

  const newCreatedPVCPromises: Promise<PersistentVolumeClaimKind | NotebookKind>[] = [];

  if (notebookChangesResult.newNotebooks.length > 0) {
    newCreatedPVCPromises.push(
      ...notebookChangesResult.newNotebooks.map((nM) =>
        attachNotebookPVC(nM.name, namespace, createdPvc.metadata.name, nM.mountPath.value, {
          dryRun,
        }),
      ),
    );
  }
  await Promise.all(newCreatedPVCPromises);
};
