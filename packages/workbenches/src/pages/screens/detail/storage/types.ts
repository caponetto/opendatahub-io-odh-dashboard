import {
  PersistentVolumeClaimKind,
  StorageClassKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

export type StorageTableData = {
  pvc: PersistentVolumeClaimKind;
  storageClass: StorageClassKind | undefined;
};
