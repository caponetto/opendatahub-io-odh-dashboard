import type { KeyValuePair } from '@odh-dashboard/dashboard-foundation-frontend/types';

export type EnvVariableDataEntry = KeyValuePair;

export enum EnvironmentVariableType {
  CONFIG_MAP = 'Config Map',
  SECRET = 'Secret',
}

export enum SecretCategory {
  GENERIC = 'secret key-value',
  AWS = 'aws',
  UPLOAD = 'secret upload',
}

export enum ConfigMapCategory {
  GENERIC = 'configmap key-value',
  UPLOAD = 'configmap upload',
}

export type EnvVariableData = {
  category: SecretCategory | ConfigMapCategory | null;
  data: EnvVariableDataEntry[];
};

export type EnvVariable = {
  type: EnvironmentVariableType | null;
  existingName?: string;
  values?: EnvVariableData;
};
