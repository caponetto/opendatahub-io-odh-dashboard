import {
  ImageStreamAndVersion,
  Volume,
  VolumeMount,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import type {
  EnvironmentFromVariable,
  NameDescType,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  NotebookKind,
  PersistentVolumeClaimKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { K8sNameDescriptionFieldData } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/K8sNameDescriptionField/types';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { UseAssignHardwareProfileResult } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useAssignHardwareProfile';
import { NotebookFeatureStore } from './screens/spawner/featureStore/utils';

export type FeastData = {
  featureStores: NotebookFeatureStore[];
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
};

export type MountPath = {
  /** Suffix to the root path */
  value: string;
  /** Any error with the value */
  error: string;
};

export type ForNotebookSelection = {
  name: string;
  mountPath: MountPath;
};

export type ClusterStorageNotebookSelection = ForNotebookSelection & {
  existingPvc: boolean;
  notebookDisplayName?: string;
  isUpdatedValue: boolean;
  newRowId?: number;
};

export type CreatingStorageObjectForNotebook = NameDescType & {
  size: string;
  forNotebook: ForNotebookSelection;
  hasExistingNotebookConnections: boolean;
  storageClassName?: string;
  mountPath?: string;
};

export type ExistingStorageObjectForNotebook = ForNotebookSelection;

export type ExistingStorageObject = {
  storage: string;
  pvc?: PersistentVolumeClaimKind;
};

export type StartNotebookData = {
  projectName: string;
  notebookData: K8sNameDescriptionFieldData;
  image: ImageStreamAndVersion;
  volumes?: Volume[];
  volumeMounts?: VolumeMount[];
  envFrom?: EnvironmentFromVariable[];
  dashboardNamespace?: string;
  connections?: Connection[];
  hardwareProfileOptions: UseAssignHardwareProfileResult<NotebookKind>;
  feastData?: FeastData;
  mlflowEnabled?: boolean;
};
