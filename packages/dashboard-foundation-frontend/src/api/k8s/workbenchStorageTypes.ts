import type { PersistentVolumeClaimKind, AccessMode } from '#~/k8sTypes';

export enum StorageType {
  NEW_PVC = 'new-persistent',
  EXISTING_PVC = 'existing-persistent',
}

export type StorageData = {
  name: string;
  k8sName?: string;
  size?: string;
  storageType?: StorageType;
  description?: string;
  storageClassName?: string;
  mountPath?: string;
  existingName?: string;
  existingPvc?: PersistentVolumeClaimKind;
  accessMode?: AccessMode;
  id?: number;
  modelName?: string;
  modelPath?: string;
};

export enum PvcModelAnnotation {
  MODEL_NAME = 'dashboard.opendatahub.io/model-name',
  MODEL_PATH = 'dashboard.opendatahub.io/model-path',
}
