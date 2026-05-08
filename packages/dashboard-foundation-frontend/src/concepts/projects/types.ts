import type { PersistentVolumeClaimKind } from '#~/k8sTypes';
import type { AccessMode } from '#~/concepts/k8s/types';

export enum NamespaceApplicationCase {
  /**
   * Supports the flow for when a project is created in the DSG create project flow.
   */
  DSG_CREATION,
  /**
   * Upgrade an existing DSG project to work with model kserve.
   */
  KSERVE_PROMOTION,
  /**
   * Nvidia NIMs run on KServe but have different requirements than regular models.
   */
  KSERVE_NIM_PROMOTION,
  /**
   * Reset a project's model serving platform configuration so the platform can be selected again.
   */
  RESET_MODEL_SERVING_PLATFORM,
}

export enum StorageType {
  NEW_PVC = 'new-persistent',
  EXISTING_PVC = 'existing-persistent',
}

export type SecretRef = {
  secretRef: {
    name: string;
  };
};
export type ConfigMapRef = {
  configMapRef: {
    name: string;
  };
};

export type EnvironmentFromVariable = Partial<SecretRef> & Partial<ConfigMapRef>;

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
