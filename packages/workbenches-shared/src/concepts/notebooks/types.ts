import type { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import type { UseAssignHardwareProfileResult } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useAssignHardwareProfile';
import type {
  ImageStreamAndVersion,
  Volume,
  VolumeMount,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { K8sNameDescriptionFieldData } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/K8sNameDescriptionField/types';
import type { EnvironmentFromVariable } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';

export type NotebookFeatureStore = {
  namespace: string;
  configName: string;
  projectName: string;
};

export type FeastData = {
  featureStores: NotebookFeatureStore[];
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
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
