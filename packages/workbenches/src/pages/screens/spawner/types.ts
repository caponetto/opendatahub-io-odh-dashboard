import {
  BuildPhase,
  ImageStreamKind,
  ImageStreamSpecTagType,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ImageStreamStatusTag } from '@odh-dashboard/dashboard-foundation-frontend/types';

export enum SpawnerPageSectionID {
  NAME_DESCRIPTION = 'name-and-description',
  WORKBENCH_IMAGE = 'workbench-image',
  DEPLOYMENT_SIZE = 'deployment-size',
  ENVIRONMENT_VARIABLES = 'environment-variables',
  CLUSTER_STORAGE = 'cluster-storage',
  CONNECTIONS = 'connections',
  FEATURE_STORE = 'feature-store',
}

export type SpawnerPageSectionTitlesType = {
  [key in SpawnerPageSectionID]: string;
};

export type BuildStatus = {
  name: string;
  status: BuildPhase;
  imageStreamVersion: string;
  timestamp?: string;
};

export type ImageStreamSelectOptionObjectType = {
  imageStream: ImageStreamKind;
  toString: () => string;
};

export type ImageVersionSelectOptionObjectType = {
  imageVersion: ImageStreamSpecTagType;
  imageStreamTag?: ImageStreamStatusTag;
  toString: () => string;
};

export type ImageVersionSelectDataType = {
  buildStatuses: BuildStatus[];
  imageStream?: ImageStreamKind;
  imageVersions: ImageStreamSpecTagType[];
};
