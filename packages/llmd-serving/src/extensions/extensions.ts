import type {
  DeployedModelServingDetails,
  DeploymentWizardFieldExtension,
  ModelServingDeploy,
  ModelServingDeploymentFormDataExtension,
  ModelServingPlatformWatchDeploymentsExtension,
  ModelServingDeleteModal,
  ModelServingDeploymentTransformExtension,
  ModelServingStartStopAction,
  AssembleModelResourceExtension,
  WizardField2Extension,
  WizardFieldApplyExtension,
  WizardFieldExtractorExtension,
} from '@odh-dashboard/model-serving-shared/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { AreaExtension } from '@odh-dashboard/plugin-core/extension-points';
import type { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type { LLMdDeployment, LLMInferenceServiceConfigKind } from '../types';
import type { LLMConfigOptionsFieldType } from '../wizardFields/LlmConfigOptionsField';
import type {
  GatewaySelectFieldData,
  GatewaySelectFieldType,
} from '../wizardFields/gateway/GatewaySelectField';

export const LLMD_SERVING_ID = 'llmd-serving';

const llmConfigOptionsFieldExtension: WizardField2Extension<
  LLMConfigOptionsFieldType,
  LLMdDeployment
> = {
  type: 'model-serving.deployment/wizard-field2',
  properties: {
    platform: LLMD_SERVING_ID,
    field: () =>
      import('../wizardFields/LlmConfigOptionsField').then(
        (m) => m.LLMConfigOptionsFieldWizardField,
      ),
  },
  flags: {
    required: [LLMD_SERVING_ID, SupportedArea.VLLM_ON_MAAS],
  },
};

const gatewaySelectFieldExtension: WizardField2Extension<GatewaySelectFieldType, LLMdDeployment> = {
  type: 'model-serving.deployment/wizard-field2',
  properties: {
    platform: LLMD_SERVING_ID,
    field: () =>
      import('../wizardFields/gateway/GatewaySelectField').then((m) => m.GatewaySelectField),
  },
  flags: {
    required: [LLMD_SERVING_ID, SupportedArea.LLMD_GATEWAY_FIELD],
  },
};

const gatewaySelectApplyExtension: WizardFieldApplyExtension<
  GatewaySelectFieldData,
  LLMdDeployment
> = {
  type: 'model-serving.deployment/wizard-field-apply',
  properties: {
    fieldId: 'llmd-serving/gateway',
    platform: LLMD_SERVING_ID,
    apply: () =>
      import('../wizardFields/gateway/gatewaySelectApplyExtract').then(
        (m) => m.applyGatewaySelectData,
      ),
  },
  flags: {
    required: [LLMD_SERVING_ID, SupportedArea.LLMD_GATEWAY_FIELD],
  },
};

const gatewaySelectExtractorExtension: WizardFieldExtractorExtension<
  GatewaySelectFieldData,
  LLMdDeployment
> = {
  type: 'model-serving.deployment/wizard-field-extractor',
  properties: {
    fieldId: 'llmd-serving/gateway',
    platform: LLMD_SERVING_ID,
    extract: () =>
      import('../wizardFields/gateway/gatewaySelectApplyExtract').then(
        (m) => m.extractGatewaySelectData,
      ),
  },
  flags: {
    required: [LLMD_SERVING_ID, SupportedArea.LLMD_GATEWAY_FIELD],
  },
};

const extensions: (
  | AreaExtension
  | ModelServingPlatformWatchDeploymentsExtension<LLMdDeployment>
  | DeployedModelServingDetails<LLMdDeployment, FetchStateObject<LLMInferenceServiceConfigKind[]>>
  | ModelServingDeploymentFormDataExtension<LLMdDeployment>
  | ModelServingDeleteModal<LLMdDeployment>
  | ModelServingDeploy<LLMdDeployment>
  | AssembleModelResourceExtension<LLMdDeployment>
  | DeploymentWizardFieldExtension<LLMdDeployment>
  | ModelServingDeploymentTransformExtension<LLMdDeployment>
  | ModelServingStartStopAction<LLMdDeployment>
  | WizardField2Extension<LLMConfigOptionsFieldType, LLMdDeployment>
  | WizardField2Extension<GatewaySelectFieldType, LLMdDeployment>
  | WizardFieldApplyExtension<GatewaySelectFieldData, LLMdDeployment>
  | WizardFieldExtractorExtension<GatewaySelectFieldData, LLMdDeployment>
)[] = [
  {
    type: 'app.area',
    properties: {
      id: LLMD_SERVING_ID,
      reliantAreas: [SupportedArea.K_SERVE],
      featureFlags: ['disableLLMd'],
    },
  },
  {
    type: 'model-serving.platform/watch-deployments',
    properties: {
      platform: LLMD_SERVING_ID,
      watch: () => import('../deployments/useWatchDeployments').then((m) => m.useWatchDeployments),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployed-model/serving-runtime',
    properties: {
      platform: LLMD_SERVING_ID,
      dataHook: () => import('../components/ServingDetails').then((m) => m.useServingDetailsData),
      ServingDetailsComponent: () =>
        import('../components/ServingDetails').then((m) => ({
          default: m.default,
        })),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/form-data',
    properties: {
      platform: LLMD_SERVING_ID,
      extractHardwareProfileConfig: () =>
        import('../deployments/hardware').then((m) => m.extractHardwareProfileConfig),
      extractModelType: () => import('../deployments/model').then((m) => m.extractModelType),
      extractModelFormat: () => import('../deployments/model').then((m) => m.extractModelFormat),
      extractReplicas: () => import('../deployments/hardware').then((m) => m.extractReplicas),
      extractRuntimeArgs: () => import('../deployments/model').then((m) => m.extractRuntimeArgs),
      extractEnvironmentVariables: () =>
        import('../deployments/model').then((m) => m.extractEnvironmentVariables),
      extractModelAvailabilityData: () =>
        import('../wizardFields/modelAvailability').then((m) => m.extractModelAvailabilityData),
      extractModelLocationData: () =>
        import('../deployments/model').then((m) => m.extractModelLocationData),
      extractModelServerTemplate: () =>
        import('../deployments/server').then((m) => m.extractModelServerTemplate),
      hardwareProfilePaths: () =>
        import('../deployments/hardware').then(
          (m) => m.LLMD_INFERENCE_SERVICE_HARDWARE_PROFILE_PATHS,
        ),
      validateExtraction: () =>
        import('../deployments/validateExtraction').then((m) => m.validateExtraction),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.platform/delete-deployment',
    properties: {
      platform: LLMD_SERVING_ID,
      onDelete: () => import('../api/LLMdDeployment').then((m) => m.deleteDeployment),
      title: 'Delete model deployment?',
      submitButtonLabel: 'Delete model deployment',
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/deploy',
    properties: {
      platform: LLMD_SERVING_ID,
      priority: 100,
      supportsOverwrite: true,
      isActive: () => import('../formUtils').then((m) => m.isLLMInferenceServiceActive),
      deploy: () => import('../deployments/deploy').then((m) => m.deployLLMdDeployment),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/assemble-model-resource',
    properties: {
      platform: LLMD_SERVING_ID,
      priority: 100,
      isActive: () => import('../formUtils').then((m) => m.isLLMInferenceServiceActive),
      assemble: () => import('../deployments/deploy').then((m) => m.assembleLLMdDeployment),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field',
    properties: {
      platform: LLMD_SERVING_ID,
      field: () => import('../wizardFields/modelServerField').then((m) => m.modelServerField),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field',
    properties: {
      platform: LLMD_SERVING_ID,
      field: () =>
        import('../wizardFields/modelAvailability').then((m) => m.modelAvailabilityField),
    },
    flags: {
      required: ['model-as-service', LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field',
    properties: {
      platform: LLMD_SERVING_ID,
      field: () =>
        import('../wizardFields/advancedOptionsFields').then((m) => m.externalRouteField),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field',
    properties: {
      platform: LLMD_SERVING_ID,
      field: () => import('../wizardFields/advancedOptionsFields').then((m) => m.tokenAuthField),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field',
    properties: {
      platform: LLMD_SERVING_ID,
      field: () =>
        import('../wizardFields/advancedOptionsFields').then((m) => m.deploymentStrategyField),
    },
    flags: {
      required: [LLMD_SERVING_ID],
    },
  },
  llmConfigOptionsFieldExtension,
  gatewaySelectFieldExtension,
  gatewaySelectApplyExtension,
  gatewaySelectExtractorExtension,
  {
    type: 'model-serving.deployments-table/start-stop-action',
    properties: {
      platform: LLMD_SERVING_ID,
      patchDeploymentStoppedStatus: () =>
        import('../deployments/status').then((m) => m.patchDeploymentStoppedStatus),
    },
  },
];

export default extensions;
