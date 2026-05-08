import type {
  CodeRef,
  ComponentCodeRef,
  Extension,
  ResolvedExtension,
} from '@odh-dashboard/plugin-types';
import type { NamespaceApplicationCase } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';
import type { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table/types';
import type {
  DisplayNameAnnotations,
  ProjectKind,
  SupportedModelFormats,
  K8sAPIOptions,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { ModelResourceType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import type { ModelServingPodSpecOptionsState } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/deprecated/useModelServingAcceleratorDeprecatedPodSpecOptionsState';
import type { CrPathConfig } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/types';
import type { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import type { ToggleState } from '@odh-dashboard/dashboard-foundation-frontend/components/StateActionToggle';
import type * as React from 'react';
import type {
  BiasMetricConfig,
  ExplainabilityAPI,
  TrustyStatusStates,
} from '#~/concepts/trustyai/types';
import type {
  WizardFormData,
  DeploymentWizardField,
  InitialWizardFormData,
  WizardField,
  ModelLocationData,
  HardwareProfileHookArgs,
  ModelTypeFieldData,
} from '#~/types/form-data';
import type { ModelServerSelectFieldData } from '#~/concepts/modelServing/ModelServerTemplateSelectField';
import type { ModelDeploymentState } from '#~/concepts/modelServing/deploymentState';

// eslint-disable-next-line no-barrel-files/no-barrel-files -- Published extension API surface
export type { ModelDeploymentState };

export type DeploymentStatus = {
  state: ModelDeploymentState;
  message?: string;
  stoppedStates?: ToggleState;
};

export type DeploymentEndpoint = {
  type: 'internal' | 'external';
  name?: string;
  description?: string;
  url: string;
  error?: string;
};

export type ServerResourceType = K8sResourceCommon & {
  metadata: {
    name: string;
    namespace: string;
    annotations?: DisplayNameAnnotations;
  };
};

// eslint-disable-next-line no-barrel-files/no-barrel-files -- Published extension API surface
export type { ModelResourceType };

export type Deployment<
  ModelResource extends ModelResourceType = ModelResourceType,
  ServerResource extends ServerResourceType = ServerResourceType,
> = {
  modelServingPlatformId: string;
  model: ModelResource;
  server?: ServerResource;
  status?: DeploymentStatus;
  endpoints?: DeploymentEndpoint[];
  apiProtocol?: string;
  resources?: ModelServingPodSpecOptionsState;
};

export type ModelServingPlatformExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.platform',
  {
    id: D['modelServingPlatformId'];
    manage: {
      namespaceApplicationCase: NamespaceApplicationCase;
      priority: number | 0;
      default?: boolean;
      projectRequirements: {
        annotations?: {
          [key: string]: string;
        };
        labels?: {
          [key: string]: string;
        };
      };
      clusterRequirements?: {
        integrationAppName: string;
      };
    };
    enableCardText: {
      title: string;
      description: string;
      selectText: string;
      enabledText: string;
      objectType: ProjectObjectType;
    };
    deployedModelsView: {
      startHintTitle: string;
      startHintDescription: string;
      deployButtonText: string;
    };
    backport?: {
      ModelsProjectDetailsTab?: ComponentCodeRef;
      ServeModelsSection?: ComponentCodeRef;
      GlobalModelsPage?: ComponentCodeRef;
    };
  }
>;

export const isModelServingPlatformExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingPlatformExtension<D> => extension.type === 'model-serving.platform';

export type ModelServingPlatformWatchDeployments =
  ResolvedExtension<ModelServingPlatformWatchDeploymentsExtension>;
/**
 * Extension point for a `watch` hook to watch deployments for a given platform.
 *
 * @returns [deployments, loaded, errors]
 * - deployments: the deployments for the given platform
 * - loaded: whether the deployments are loaded (NOTE: loading should resolve to true if an error is encountered)
 * - errors: any errors encountered while loading the deployments
 */
export type ModelServingPlatformWatchDeploymentsExtension<D extends Deployment = Deployment> =
  Extension<
    'model-serving.platform/watch-deployments',
    {
      platform: D['modelServingPlatformId'];
      watch: CodeRef<
        (
          project: ProjectKind,
          labelSelectors?: { [key: string]: string },
          filterFn?: (model: D['model']) => boolean,
          opts?: K8sAPIOptions,
        ) => [D[] | undefined, boolean, Error[] | undefined]
      >;
    }
  >;
export const isModelServingPlatformWatchDeployments = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingPlatformWatchDeploymentsExtension<D> =>
  extension.type === 'model-serving.platform/watch-deployments';

export type ExtractionResult<T> = {
  data: T;
  error?: string;
};

export type ModelServingDeploymentFormDataExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/form-data',
  {
    platform: D['modelServingPlatformId'];
    hardwareProfilePaths: CodeRef<CrPathConfig>;
    extractHardwareProfileConfig: CodeRef<
      (deployment: D) => ExtractionResult<HardwareProfileHookArgs | null>
    >;
    extractModelFormat?: CodeRef<(deployment: D) => SupportedModelFormats | null>;
    extractReplicas: CodeRef<(deployment: D) => ExtractionResult<number | null>>;
    extractRuntimeArgs: CodeRef<(deployment: D) => { enabled: boolean; args: string[] } | null>;
    extractEnvironmentVariables: CodeRef<
      (deployment: D) => { enabled: boolean; variables: { name: string; value: string }[] } | null
    >;
    extractModelAvailabilityData: CodeRef<
      (deployment: D) => { saveAsAiAsset: boolean; useCase?: string } | null
    >;
    extractModelLocationData: CodeRef<(deployment: D) => ModelLocationData | null>;
    extractDeploymentStrategy?: CodeRef<
      (deployment: D) => WizardFormData['state']['deploymentStrategy']['data'] | null
    >;
    extractModelType?: CodeRef<(deployment: D) => ModelTypeFieldData | null>;
    extractModelServerTemplate: CodeRef<
      (deployment: D, dashboardNamespace?: string) => { data: ModelServerSelectFieldData } | null
    >;
    validateExtraction?: CodeRef<(deployment: D) => string[]>;
  }
>;
export const isModelServingDeploymentFormDataExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingDeploymentFormDataExtension<D> =>
  extension.type === 'model-serving.deployment/form-data';

export type ModelServingAuthExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.auth',
  {
    platform: D['modelServingPlatformId'];
    usePlatformAuthEnabled: CodeRef<(deployment?: D) => boolean>;
  }
>;
export const isModelServingAuthExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingAuthExtension<D> => extension.type === 'model-serving.auth';

export type DeploymentsTableColumn<D extends Deployment = Deployment> = SortableData<D> & {
  cellRenderer: (deployment: D, column: string) => React.ReactNode;
};

export type ModelServingDeploymentsTableExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.deployments-table',
  {
    platform: D['modelServingPlatformId'];
    columns: CodeRef<() => DeploymentsTableColumn<D>[]>;
  }
>;
export const isModelServingDeploymentsTableExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingDeploymentsTableExtension<D> =>
  extension.type === 'model-serving.deployments-table';

export type ModelServingDeleteModal<D extends Deployment = Deployment> = Extension<
  'model-serving.platform/delete-deployment',
  {
    platform: D['modelServingPlatformId'];
    onDelete: CodeRef<(deployment: D) => Promise<void>>;
    title: string;
    submitButtonLabel: string;
  }
>;

export const isModelServingDeleteModal = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingDeleteModal<D> =>
  extension.type === 'model-serving.platform/delete-deployment';

export type ModelServingMetricsExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.metrics',
  {
    platform: D['modelServingPlatformId'];
  }
>;

export const isModelServingMetricsExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingMetricsExtension<D> => extension.type === 'model-serving.metrics';

export type DeployedModelServingDetails<
  D extends Deployment = Deployment,
  Data = unknown,
> = Extension<
  'model-serving.deployed-model/serving-runtime',
  {
    platform: D['modelServingPlatformId'];
    dataHook?: CodeRef<() => Data>;
    ServingDetailsComponent: ComponentCodeRef<{ deployment: D; data?: Data }>;
  }
>;

export const isDeployedModelServingDetails = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is DeployedModelServingDetails<D> =>
  extension.type === 'model-serving.deployed-model/serving-runtime';

export type ModelServingStartStopAction<D extends Deployment = Deployment> = Extension<
  'model-serving.deployments-table/start-stop-action',
  {
    platform: D['modelServingPlatformId'];
    patchDeploymentStoppedStatus: CodeRef<
      (deployment: D, isStopped: boolean) => Promise<D['model']>
    >;
  }
>;

export const isModelServingStartStopAction = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingStartStopAction<D> =>
  extension.type === 'model-serving.deployments-table/start-stop-action';

export type ModelServingPlatformFetchDeploymentStatus<D extends Deployment = Deployment> =
  Extension<
    'model-serving.platform/fetch-deployment-status',
    {
      platform: D['modelServingPlatformId'];
      fetch: CodeRef<(name: string, namespace: string) => Promise<D | null>>;
    }
  >;

export const isModelServingPlatformFetchDeploymentStatus = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingPlatformFetchDeploymentStatus<D> =>
  extension.type === 'model-serving.platform/fetch-deployment-status';

export type DeploymentAssemblyFn<D extends Deployment = Deployment> = (deployment: D) => D;
export type DeploymentAssemblyResources<D extends Deployment = Deployment> = {
  model?: D['model'];
  server?: D['server'];
};

export type ModelServingDeploy<D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/deploy',
  {
    platform: D['modelServingPlatformId'];
    isActive:
      | CodeRef<
          (
            wizardData: WizardFormData['state'],
            resources?: DeploymentAssemblyResources<D>,
          ) => boolean
        >
      | true;
    priority: number | 0;
    supportsOverwrite?: boolean;
    deploy: CodeRef<
      (
        wizardData: WizardFormData['state'],
        projectName: string,
        existingDeployment?: D,
        modelResource?: D['model'],
        serverResource?: D['server'],
        serverResourceTemplateName?: string,
        dryRun?: boolean,
        secretName?: string,
        overwrite?: boolean,
        initialWizardData?: InitialWizardFormData,
        applyFieldData?: DeploymentAssemblyFn<D>,
      ) => Promise<D>
    >;
  }
>;
export const isModelServingDeploy = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingDeploy<D> => extension.type === 'model-serving.deployment/deploy';

export type AssembleModelResourceFn<D extends Deployment = Deployment> = (
  wizardData: WizardFormData,
  existingDeployment?: D,
  applyFieldData?: DeploymentAssemblyFn<D>,
  connectionSecretName?: string,
) => D;

export type AssembleModelResourceExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/assemble-model-resource',
  {
    platform: D['modelServingPlatformId'];
    isActive: CodeRef<(wizardData: WizardFormData['state']) => boolean> | true;
    priority: number | 0;
    assemble: CodeRef<AssembleModelResourceFn<D>>;
  }
>;
export const isAssembleModelResourceExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is AssembleModelResourceExtension<D> =>
  extension.type === 'model-serving.deployment/assemble-model-resource';

export type DeploymentWizardFieldExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/wizard-field',
  {
    platform: D['modelServingPlatformId'];
    field: CodeRef<DeploymentWizardField>;
  }
>;
export const isDeploymentWizardFieldExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is DeploymentWizardFieldExtension<D> =>
  extension.type === 'model-serving.deployment/wizard-field';

export type WizardField2Extension<
  WizardFieldType = WizardField,
  D extends Deployment = Deployment,
> = Extension<
  'model-serving.deployment/wizard-field2',
  {
    platform?: D['modelServingPlatformId'];
    field: CodeRef<WizardFieldType>;
  }
>;
export const isWizardField2Extension = <
  WizardFieldType = WizardField,
  D extends Deployment = Deployment,
>(
  extension: Extension,
): extension is WizardField2Extension<WizardFieldType, D> =>
  extension.type === 'model-serving.deployment/wizard-field2';

export type ModelServingDeploymentTransformExtension<D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/transform',
  {
    platform: D['modelServingPlatformId'];
    transform: CodeRef<(deployment: D, initialWizardData: InitialWizardFormData) => D>;
  }
>;
export const isModelServingDeploymentTransformExtension = <D extends Deployment = Deployment>(
  extension: Extension,
): extension is ModelServingDeploymentTransformExtension<D> =>
  extension.type === 'model-serving.deployment/transform';

export type WizardFieldApplyExtension<T = unknown, D extends Deployment = Deployment> = Extension<
  'model-serving.deployment/wizard-field-apply',
  {
    fieldId: string;
    platform: D['modelServingPlatformId'];
    apply: CodeRef<(deployment: D, fieldData: T, wizardState: WizardFormData['state']) => D>;
  }
>;
export const isWizardFieldApplyExtension = <T = unknown, D extends Deployment = Deployment>(
  extension: Extension,
): extension is WizardFieldApplyExtension<T, D> =>
  extension.type === 'model-serving.deployment/wizard-field-apply';

export type WizardFieldExtractorExtension<
  T = unknown,
  D extends Deployment = Deployment,
> = Extension<
  'model-serving.deployment/wizard-field-extractor',
  {
    fieldId: string;
    platform: D['modelServingPlatformId'];
    extract: CodeRef<(deployment: D) => T | undefined>;
  }
>;
export const isWizardFieldExtractorExtension = <T = unknown, D extends Deployment = Deployment>(
  extension: Extension,
): extension is WizardFieldExtractorExtension<T, D> =>
  extension.type === 'model-serving.deployment/wizard-field-extractor';

export type WizardFieldDeploymentFunctionsExtension<
  T = unknown,
  D extends Deployment = Deployment,
> = Extension<
  'model-serving.deployment/wizard-field-deployment-functions',
  {
    fieldId: string;
    platform: D['modelServingPlatformId'];
    preDeploy: CodeRef<
      (
        fieldData: T,
        wizardState: WizardFormData['state'],
        deployment: D,
        existingDeployment?: D,
      ) => Promise<D>
    >;
    postDeploy: CodeRef<
      (fieldData: T, deployedModel: D['model'], existingDeployment?: D) => Promise<void>
    >;
  }
>;
export const isWizardFieldDeploymentFunctionsExtension = <
  T = unknown,
  D extends Deployment = Deployment,
>(
  extension: Extension,
): extension is WizardFieldDeploymentFunctionsExtension<T, D> =>
  extension.type === 'model-serving.deployment/wizard-field-deployment-functions';

export type ModelBiasData = {
  biasMetricConfigs: BiasMetricConfig[];
  statusState: TrustyStatusStates;
  refresh: () => Promise<unknown>;
  api: ExplainabilityAPI;
};

export type ModelServingBiasIntegrationExtension = Extension<
  'model-serving.metrics/bias-integration',
  {
    ContextProvider: CodeRef<
      React.ComponentType<{ namespace: string; children?: React.ReactNode }>
    >;
    useModelBiasData: CodeRef<() => ModelBiasData>;
    useIsBiasAvailable: CodeRef<() => boolean>;
  }
>;
export const isModelServingBiasIntegrationExtension = (
  extension: Extension,
): extension is ModelServingBiasIntegrationExtension =>
  extension.type === 'model-serving.metrics/bias-integration';

export type ProjectMetricsRoutesProps = {
  modelMetricsEnabled: boolean;
  biasMetricsAreaAvailable: boolean;
};

export type ModelServingMetricsRoutesExtension = Extension<
  'model-serving.metrics/routes',
  {
    Component: ComponentCodeRef<ProjectMetricsRoutesProps>;
  }
>;

export const isModelServingMetricsRoutesExtension = (
  extension: Extension,
): extension is ModelServingMetricsRoutesExtension =>
  extension.type === 'model-serving.metrics/routes';
