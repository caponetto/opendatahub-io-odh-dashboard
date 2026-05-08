import type {
  DeploymentWizardField,
  DeploymentStrategyField,
  ExternalRouteField as ExternalRouteWizardField,
  ModelAvailabilityField,
  ModelServerTemplateField,
  TokenAuthField,
  WizardField,
  WizardFormData,
} from '@odh-dashboard/model-serving-shared/types/form-data';

export enum ConnectionTypeRefs {
  S3 = 's3',
  URI = 'uri-v1',
  OCI = 'oci-v1',
}

export enum ModelLocationSelectOption {
  EXISTING = 'Existing connection',
  PVC = 'Cluster storage',
  S3 = 'S3 object storage',
  OCI = 'OCI compliant registry',
  URI = 'URI',
}

export enum ModelTypeLabel {
  PREDICTIVE = 'Predictive model',
  GENERATIVE = 'Generative AI model (Example, LLM)',
}

export enum ModelStateLabel {
  STOPPED = 'Stopped',
  STOPPING = 'Stopping',
  STARTING = 'Starting',
  READY = 'Ready',
  RUNNING = 'Running',
  FAILED_TO_LOAD = 'Failed to load',
}

export enum ModelStateToggleLabel {
  START = 'Start',
  STOP = 'Stop',
}

export enum WizardStepTitle {
  MODEL_DETAILS = 'Model details',
  MODEL_DEPLOYMENT = 'Model deployment',
  ADVANCED_SETTINGS = 'Advanced settings',
  REVIEW = 'Review',
}

export enum YAMLViewerToggleOption {
  YAML = 'YAML',
  FORM = 'Form',
}

export const resolveFieldValue = (
  field: WizardField,
  state: WizardFormData['state'],
): unknown | undefined => {
  const storedValue: unknown = field.id in state ? state[field.id] : undefined;
  if (storedValue == null) {
    return undefined;
  }
  return field.reducerFunctions.getFieldData
    ? field.reducerFunctions.getFieldData(storedValue, state)
    : storedValue;
};

export const isModelServerTemplateField = (
  field: DeploymentWizardField,
): field is ModelServerTemplateField => {
  return field.id === 'modelServerTemplate';
};

export const isModelAvailabilityField = (
  field: DeploymentWizardField,
): field is ModelAvailabilityField => {
  return field.id === 'modelAvailability';
};

export const isExternalRouteField = (
  field: DeploymentWizardField,
): field is ExternalRouteWizardField => {
  return field.id === 'externalRoute';
};

export const isTokenAuthField = (field: DeploymentWizardField): field is TokenAuthField => {
  return field.id === 'tokenAuth';
};

export const isDeploymentStrategyField = (
  field: DeploymentWizardField,
): field is DeploymentStrategyField => {
  return field.id === 'deploymentStrategy';
};
