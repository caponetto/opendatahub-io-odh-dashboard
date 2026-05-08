// eslint-disable-next-line no-restricted-syntax
import { NamespaceApplicationCase } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';
// eslint-disable-next-line no-restricted-syntax, @typescript-eslint/consistent-type-imports
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import type {
  ModelServingPlatformExtension,
  ModelServingDeleteModal,
  ModelServingPlatformWatchDeploymentsExtension,
  ModelServingMetricsExtension,
  ModelServingAuthExtension,
  DeployedModelServingDetails,
  ModelServingStartStopAction,
  ModelServingPlatformFetchDeploymentStatus,
  ModelServingDeploymentFormDataExtension,
  ModelServingDeploy,
  WizardField2Extension,
  WizardFieldApplyExtension,
  WizardFieldExtractorExtension,
} from '@odh-dashboard/model-serving-shared/extension-points';
import type { WizardField } from '@odh-dashboard/model-serving-shared/types/form-data';
import type { AreaExtension } from '@odh-dashboard/plugin-core/extension-points';
// eslint-disable-next-line no-restricted-syntax
import {
  DataScienceStackComponent,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { TimeoutFieldValue } from './wizardFields/timeout/TimeoutField';
import type { KServeDeployment } from './deployments';

export const KSERVE_ID = 'kserve';

const extensions: (
  | AreaExtension
  | ModelServingPlatformExtension<KServeDeployment>
  | ModelServingPlatformWatchDeploymentsExtension<KServeDeployment>
  | ModelServingDeploymentFormDataExtension<KServeDeployment>
  | ModelServingAuthExtension<KServeDeployment>
  | ModelServingDeleteModal<KServeDeployment>
  | ModelServingMetricsExtension<KServeDeployment>
  | DeployedModelServingDetails<KServeDeployment>
  | ModelServingStartStopAction<KServeDeployment>
  | ModelServingPlatformFetchDeploymentStatus<KServeDeployment>
  | ModelServingDeploy<KServeDeployment>
  | WizardField2Extension<WizardField<TimeoutFieldValue, undefined>, KServeDeployment>
  | WizardFieldApplyExtension<TimeoutFieldValue, KServeDeployment>
  | WizardFieldExtractorExtension<TimeoutFieldValue, KServeDeployment>
)[] = [
  {
    type: 'app.area',
    properties: {
      id: SupportedArea.K_SERVE,
      featureFlags: ['disableKServe'],
      requiredComponents: [DataScienceStackComponent.K_SERVE],
      reliantAreas: [SupportedArea.MODEL_SERVING],
    },
  },
  {
    type: 'model-serving.platform',
    properties: {
      id: KSERVE_ID,
      manage: {
        namespaceApplicationCase: NamespaceApplicationCase.KSERVE_PROMOTION,
        priority: 0,
        default: true,
        projectRequirements: {
          labels: {
            'modelmesh-enabled': 'false',
          },
        },
      },
      enableCardText: {
        title: 'Enable model serving',
        description:
          'Enable users to serve models using the single-model serving platform which deploys each model on its own dedicated model server. ',
        selectText: 'Select single-model',
        enabledText: 'Single-model serving enabled',
        objectType: ProjectObjectType.singleModel,
      },
      deployedModelsView: {
        startHintTitle: 'Start by deploying a model',
        startHintDescription: 'Each model is deployed on its own model server',
        deployButtonText: 'Deploy model',
      },
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.platform/watch-deployments',
    properties: {
      platform: KSERVE_ID,
      watch: () => import('./deployments').then((m) => m.useWatchDeployments),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.platform/delete-deployment',
    properties: {
      platform: KSERVE_ID,
      onDelete: () => import('./deployments').then((m) => m.deleteDeployment),
      title: 'Delete model deployment?',
      submitButtonLabel: 'Delete model deployment',
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.metrics',
    properties: {
      platform: KSERVE_ID,
    },
    flags: {
      required: [SupportedArea.K_SERVE, SupportedArea.K_SERVE_METRICS],
    },
  },
  {
    type: 'model-serving.deployed-model/serving-runtime',
    properties: {
      platform: KSERVE_ID,
      ServingDetailsComponent: () => import('./components/deploymentServingDetails'),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployments-table/start-stop-action',
    properties: {
      platform: KSERVE_ID,
      patchDeploymentStoppedStatus: () =>
        import('./deploymentStatus').then((m) => m.patchDeploymentStoppedStatus),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.platform/fetch-deployment-status',
    properties: {
      platform: KSERVE_ID,
      fetch: () => import('./deployments').then((m) => m.fetchDeploymentStatus),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployment/form-data',
    properties: {
      platform: KSERVE_ID,
      extractHardwareProfileConfig: () =>
        import('./hardware').then((m) => (deployment) => ({
          data: m.extractHardwareProfileConfig(deployment),
        })),
      extractModelType: () => import('./deployUtils').then((m) => m.extractModelType),
      extractModelFormat: () => import('./modelFormat').then((m) => m.extractKServeModelFormat),
      extractReplicas: () =>
        import('./hardware').then((m) => (deployment) => ({
          data: m.extractReplicas(deployment),
        })),
      extractRuntimeArgs: () => import('./hardware').then((m) => m.extractRuntimeArgs),
      extractEnvironmentVariables: () =>
        import('./hardware').then((m) => m.extractEnvironmentVariables),
      extractModelAvailabilityData: () =>
        import('./aiAssets').then((m) => m.extractModelAvailabilityData),
      extractModelLocationData: () =>
        import('./modelLocationData').then((m) => m.extractKServeModelLocationData),
      extractDeploymentStrategy: () =>
        import('./deployUtils').then((m) => m.extractDeploymentStrategy),
      extractModelServerTemplate: () =>
        import('./deployServer').then((m) => m.extractModelServerTemplate),
      hardwareProfilePaths: () =>
        import('./hardware').then((m) => m.INFERENCE_SERVICE_HARDWARE_PROFILE_PATHS),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployment/deploy',
    properties: {
      platform: KSERVE_ID,
      isActive: true,
      priority: 0,
      supportsOverwrite: true,
      deploy: () => import('./deploy').then((m) => m.deployKServeDeployment),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field2',
    properties: {
      platform: KSERVE_ID,
      field: () =>
        import('./wizardFields/timeout/TimeoutField').then((m) => m.TimeoutFieldWizardField),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field-apply',
    properties: {
      fieldId: 'kserve/timeout',
      platform: KSERVE_ID,
      apply: () =>
        import('./wizardFields/timeout/timeoutApplyExtract').then((m) => m.applyTimeoutFieldData),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
  {
    type: 'model-serving.deployment/wizard-field-extractor',
    properties: {
      fieldId: 'kserve/timeout',
      platform: KSERVE_ID,
      extract: () =>
        import('./wizardFields/timeout/timeoutApplyExtract').then((m) => m.extractTimeoutFieldData),
    },
    flags: {
      required: [SupportedArea.K_SERVE],
    },
  },
];

export default extensions;
