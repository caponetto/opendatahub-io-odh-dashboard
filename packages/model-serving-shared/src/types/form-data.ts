import type * as React from 'react';
import type { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import type {
  Connection,
  ConnectionTypeConfigMapObj,
  ConnectionTypeValueType,
  LabeledConnection,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import type { RecursivePartial } from '@odh-dashboard/dashboard-foundation-frontend/typeHelpers';
import type {
  ProjectKind,
  SecretKind,
  SupportedModelFormats,
  PersistentVolumeClaimKind,
  TemplateKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { UseK8sNameDescriptionFieldData } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/K8sNameDescriptionField/types';
import type { ServingRuntimeModelType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { UseHardwareProfileConfigResult } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useHardwareProfileConfig';
import type { ZodSchema } from 'zod';
import type {
  ModelServerOption,
  ModelServerSelectField,
  ModelServerSelectFieldData,
} from '#~/concepts/modelServing/ModelServerTemplateSelectField';
import type { ModelServingClusterSettings } from '#~/concepts/modelServing/useModelServingClusterSettings';
import { ModelLocationType } from '#~/concepts/modelServing/modelLocationTypes';

/** Matches positional args accepted by {@link import('@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useHardwareProfileConfig').useHardwareProfileConfig}. */
export type HardwareProfileHookArgs = Parameters<
  typeof import('@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useHardwareProfileConfig').useHardwareProfileConfig
>;

/** Data shape from {@link ServingRuntimeModelType} predictive / generative selectors. */
export type ModelTypeFieldData = {
  type: ServingRuntimeModelType.PREDICTIVE | ServingRuntimeModelType.GENERATIVE;
  legacyVLLM: boolean;
};

export type ModelTypeField = {
  data: ModelTypeFieldData | undefined;
  setData: (data: ModelTypeFieldData) => void;
};

export type ModelLocationData = {
  type: ModelLocationType;
  connectionTypeObject?: ConnectionTypeConfigMapObj;
  connection?: string;
  disableInputFields?: boolean;
  prefillAlertText?: string;
  fieldValues: Record<string, ConnectionTypeValueType>;
  additionalFields: {
    modelPath?: string;
    modelUri?: string;
    pvcConnection?: string;
  };
};

export type ModelAvailabilityFieldsData = {
  saveAsAiAsset: boolean;
  useCase?: string;
};

export type ModelAvailabilityFields = {
  data: ModelAvailabilityFieldsData;
  setData: (data: ModelAvailabilityFieldsData) => void;
  isGenAiEnabled: boolean;
  showField?: boolean;
  showSaveAsMaaS?: boolean;
};

export type ExternalRouteFieldData = boolean;

export type ExternalRouteFieldHook = {
  data: ExternalRouteFieldData | undefined;
  setData: (data: ExternalRouteFieldData) => void;
  isVisible: boolean;
};

export type NumReplicasFieldData = number;

export type NumReplicasFieldHook = {
  data: NumReplicasFieldData | undefined;
  setReplicas: (replicas: number) => void;
};

export type RuntimeArgsFieldData = {
  enabled: boolean;
  args: string[];
};

export type RuntimeArgsFieldHook = {
  data: RuntimeArgsFieldData | undefined;
  setData: (data: RuntimeArgsFieldData) => void;
};

export type EnvironmentVariablesFieldData =
  | { enabled: true; variables: Array<{ name: string; value: string }> }
  | {
      enabled: false;
      variables: Array<{ name: string; value: string }>;
    };

export type EnvironmentVariablesFieldHook = {
  data: EnvironmentVariablesFieldData | undefined;
  setData: (data: EnvironmentVariablesFieldData) => void;
};

/** Single token configuration row used by the token-authentication wizard field. */
export type TokenAuthenticationRow = {
  uuid: string;
  displayName: string;
  k8sName?: string;
  error?: string;
};

export type TokenAuthenticationFieldData = TokenAuthenticationRow[];

export type TokenAuthenticationFieldHook = {
  data: TokenAuthenticationFieldData | undefined;
  setData: (data: TokenAuthenticationFieldData) => void;
  shouldAutoCheck: boolean;
  isDisabled: boolean;
};

export type CreateConnectionData = {
  saveConnection?: boolean;
  nameDesc?: UseK8sNameDescriptionFieldData['data'];
  hideFields?: boolean;
};

export type CreateConnectionDataField = {
  data: CreateConnectionData;
  setData: (data: CreateConnectionData) => void;
  projectName?: string;
};

export type DeploymentStrategyFieldData = 'rolling' | 'recreate';

export type DeploymentStrategyFieldHook = {
  data: DeploymentStrategyFieldData;
  setData: (data: DeploymentStrategyFieldData) => void;
  isVisible: boolean;
};

export type ModelFormatState = {
  modelFormatOptions: SupportedModelFormats[];
  modelFormat?: SupportedModelFormats;
  setModelFormat: (modelFormat: SupportedModelFormats) => void;
  isVisible?: boolean;
  error?: Error;
  loaded: boolean;
  templatesFilteredForModelType?: TemplateKind[];
};

export type ModelLocationDataField = {
  data: ModelLocationData | undefined;
  setData: (data: ModelLocationData | undefined) => void;
  projectName?: string;
  connections: Connection[];
  connectionsLoaded: boolean;
  connectionTypes: ConnectionTypeConfigMapObj[];
  connectionTypesLoaded: boolean;
  selectedConnection: Connection | undefined;
  setSelectedConnection: (connection: Connection | undefined) => void;
  isLoadingSecretData: boolean;
  disableInputFields: boolean;
  pvcs: PersistentVolumeClaimKind[];
};

/** Project selector strip used at the top of the deployment wizard. */
export type ProjectSectionType = {
  initialProjectName?: string;
  projectName?: string;
  setProjectName: (projectName?: string) => void;
};

/**
 * Initial data for the deployment wizard form.
 * Known field data properties are explicitly typed, while dynamic field data
 * (from WizardField2Extension) can be added with any string key.
 */
export type InitialWizardFormData = {
  wizardStartIndex?: number;
  isEditing?: boolean;
  viewMode?: 'form' | 'yaml-preview' | 'yaml-edit';
  project?: ProjectKind | null;
  modelTypeField?: ModelTypeFieldData;
  k8sNameDesc?: UseK8sNameDescriptionFieldData['data'];
  externalRoute?: ExternalRouteFieldData;
  tokenAuthentication?: TokenAuthenticationFieldData;
  existingAuthTokens?: SecretKind[];
  numReplicas?: NumReplicasFieldData;
  runtimeArgs?: RuntimeArgsFieldData;
  environmentVariables?: EnvironmentVariablesFieldData;
  hardwareProfile?: HardwareProfileHookArgs;
  modelFormat?: SupportedModelFormats;
  modelLocationData?: ModelLocationData;
  modelServer?: { data: ModelServerSelectFieldData };
  connections?: LabeledConnection[];
  initSelectedConnection?: LabeledConnection | undefined;
  modelAvailability?: ModelAvailabilityFieldsData;
  createConnectionData?: CreateConnectionData;
  deploymentStrategy?: DeploymentStrategyFieldData;
  navSourceMetadata?: K8sResourceCommon['metadata'];
} & Record<string, unknown>;

export type WizardFormDataState = {
  project: ProjectSectionType;
  modelType: ModelTypeField;
  k8sNameDesc: UseK8sNameDescriptionFieldData;
  hardwareProfileConfig: UseHardwareProfileConfigResult;
  modelFormatState: ModelFormatState;
  modelLocationData: ModelLocationDataField;
  externalRoute: ExternalRouteFieldHook;
  tokenAuthentication: TokenAuthenticationFieldHook;
  numReplicas: NumReplicasFieldHook;
  runtimeArgs: RuntimeArgsFieldHook;
  environmentVariables: EnvironmentVariablesFieldHook;
  modelAvailability: ModelAvailabilityFields;
  modelServer: ModelServerSelectField;
  createConnectionData: CreateConnectionDataField;
  deploymentStrategy: DeploymentStrategyFieldHook;
  canCreateRoleBindings: boolean;
} & Record<string, unknown>;

export type WizardFormData = {
  initialData?: InitialWizardFormData;
  state: WizardFormDataState;
};

export type WizardReviewItem = {
  key: string;
  label: string;
  value: (wizardState: WizardFormDataState) => React.ReactNode;
  optional?: boolean;
  isVisible?: (wizardState: WizardFormDataState) => boolean;
};

export type WizardReviewSection = {
  title?: string;
  items: WizardReviewItem[];
};

export type K8sNameDescriptionFieldData = UseK8sNameDescriptionFieldData['data'];

export type CreateConnectionFieldData = WizardFormDataState['createConnectionData']['data'];
export type HardwareProfileConfigFieldData =
  WizardFormDataState['hardwareProfileConfig']['formData'];
export type ModelFormatFieldData = NonNullable<
  WizardFormDataState['modelFormatState']['modelFormat']
>;

export type DeploymentWizardFieldId =
  | 'modelServerTemplate'
  | 'modelAvailability'
  | 'externalRoute'
  | 'tokenAuth'
  | 'deploymentStrategy';

export type DeploymentWizardFieldBase<ID extends DeploymentWizardFieldId | string> = {
  id: ID;
  type: 'modifier' | 'replacement' | 'addition';
} & {
  isActive: (wizardFormData: RecursivePartial<WizardFormDataState>) => boolean;
};

export type GenericFieldProps = {
  isEditing?: boolean;
  isDisabled?: boolean;
};

export type WizardStateOverrides = {
  tokenAuthentication?: { isDisabled?: boolean };
  'llmd-serving/gateway'?: {
    isDisabled?: boolean;
    selection?: { name: string; namespace?: string };
    hiddenOptions?: { name: string; namespace?: string }[];
  };
};

export type WizardField<
  FieldData = unknown,
  ExternalData = unknown,
  Dependencies extends Record<string, unknown> = Record<string, unknown>,
> = DeploymentWizardFieldBase<string> & {
  type: 'addition' | 'replacement';
  parentId?: string;
  step?: 'modelSource' | 'modelDeployment' | 'advancedOptions' | 'summary';
  reducerFunctions: {
    setFieldData: (fieldData: FieldData) => FieldData;
    getFieldData?: (storedValue: FieldData, wizardState: WizardFormDataState) => FieldData;
    getInitialFieldData: (
      existingFieldData?: FieldData,
      externalData?: ExternalData,
      dependencies?: Dependencies,
    ) => FieldData;
    resolveDependencies?: (formData: WizardFormDataState) => Dependencies;
    validationSchema?: ZodSchema<FieldData>;
    getFieldOverrides?: (
      effectiveValue: FieldData,
      wizardState: RecursivePartial<WizardFormDataState>,
    ) => WizardStateOverrides;
  };
  shouldResetOnDependencyChange?: boolean;
  externalDataHook?: (dependencies?: Dependencies) => {
    data: ExternalData;
    loaded: boolean;
    loadError?: Error;
  };
  component: React.FC<
    {
      id: string;
      value?: FieldData;
      initialValue?: FieldData;
      onChange: (value: FieldData) => void;
      externalData?: { data: ExternalData; loaded: boolean; loadError?: Error };
      dependencies?: Dependencies;
    } & GenericFieldProps
  >;
  getReviewSections?: (
    value: FieldData,
    wizardState: WizardFormDataState,
    externalData?: ExternalData,
  ) => WizardReviewSection[];
};

export type ModelServerTemplateField = DeploymentWizardFieldBase<'modelServerTemplate'> & {
  extraOptions?: ModelServerOption[];
  suggestion?: (clusterSettings?: ModelServingClusterSettings) => ModelServerOption | undefined;
};

export type ModelAvailabilityField = DeploymentWizardFieldBase<'modelAvailability'> & {
  id: 'modelAvailability';
  showSaveAsMaaS?: boolean;
};

export type ExternalRouteField = DeploymentWizardFieldBase<'externalRoute'> & {
  isVisible: boolean;
};

export type TokenAuthField = DeploymentWizardFieldBase<'tokenAuth'> & {
  initialValue: boolean;
};

export type DeploymentStrategyField = DeploymentWizardFieldBase<'deploymentStrategy'> & {
  id: 'deploymentStrategy';
  type: 'modifier';
  isVisible: boolean;
};

export type DeploymentWizardField =
  | ModelServerTemplateField
  | ModelAvailabilityField
  | ExternalRouteField
  | TokenAuthField
  | DeploymentStrategyField;
