import type { AlertVariant } from '@patternfly/react-core';
import type {
  ImagePullSecret,
  ServingContainer,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  type KeyValuePair,
  InferenceServiceStorageType,
} from '@odh-dashboard/dashboard-foundation-frontend/types';

type EnvVariableDataEntry = KeyValuePair;

export enum PerformanceMetricType {
  SERVER = 'server',
  MODEL = 'model',
}

export type SupportedModelFormatsInfo = {
  name: string;
  version: string;
  autoSelect?: boolean;
  priority?: number;
};

export type ServingRuntimeToken = {
  uuid: string;
  name: string;
  error: string;
  editName?: string;
};

export type CreatingModelServingObjectCommon = {
  name: string;
  k8sName: string;
  externalRoute: boolean;
  tokenAuth: boolean;
  tokens: ServingRuntimeToken[];
};

export type CreatingServingRuntimeObject = CreatingModelServingObjectCommon & {
  servingRuntimeTemplateName: string;
  numReplicas: number;
  imageName?: string;
  supportedModelFormatsInfo?: SupportedModelFormatsInfo;
  scope?: string;
};

export type InferenceServiceStorage = {
  type: InferenceServiceStorageType;
  path: string;
  dataConnection: string;
  uri?: string;
  awsData: EnvVariableDataEntry[];
  pvcConnection?: string;
  alert?: {
    type: AlertVariant;
    title: string;
    message: string;
  };
};

export type InferenceServiceFormat = {
  name: string;
  version?: string;
};

export type CreatingInferenceServiceObject = CreatingModelServingObjectCommon & {
  project: string;
  servingRuntimeName: string;
  storage: InferenceServiceStorage;
  format: InferenceServiceFormat;
  maxReplicas: number;
  minReplicas: number;
  labels?: Record<string, string>;
  servingRuntimeArgs?: ServingContainer['args'];
  servingRuntimeEnvVars?: ServingContainer['env'];
  imagePullSecrets?: ImagePullSecret[];
  dashboardNamespace?: string;
};
