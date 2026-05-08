import { K8sStatus } from '@odh-dashboard/k8s-browser';
import {
  assembleSecretSA,
  createSecret,
  deleteSecret,
  replaceSecret,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import { assembleServiceAccount } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/serviceAccounts';
import { generateRoleInferenceService } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/roles';
import { generateRoleBindingServiceAccount } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/roleBindings';
import { addOwnerReference } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import {
  SecretKind,
  K8sAPIOptions,
  InferenceServiceKind,
  SupportedModelFormats,
  MetadataAnnotation,
  KnownLabels,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getTokenNames } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import {
  isModelServingCompatible,
  ModelServingCompatibleTypes,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/utils';
import type {
  ModelLocationData,
  ModelTypeFieldData,
  ModelAvailabilityFieldsData,
  RuntimeArgsFieldData,
  EnvironmentVariablesFieldData,
  CreateConnectionData,
  DeploymentStrategyFieldData,
} from '@odh-dashboard/model-serving-shared/types/form-data';
import { ServingRuntimeModelType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  isValidModelType,
  deploymentStrategyRolling,
  deploymentStrategyRecreate,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/deploymentWizardConstants';
import {
  createServiceAccountIfMissing,
  createRoleIfMissing,
  createRoleBindingIfMissing,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/createIfMissing';
import type { CreatingInferenceServiceObject } from './deployModel';
import type { KServeDeployment } from './deployments';

export { createServiceAccountIfMissing, createRoleIfMissing, createRoleBindingIfMissing };

export const getModelServiceAccountName = (name: string): string => `${name}-sa`;

export const getModelRole = (name: string): string => `${name}-view-role`;
export const getModelRoleBinding = (name: string): string => `${name}-view`;

export const createSecrets = async (
  fillData: CreatingInferenceServiceObject,
  deployedModelName: string,
  namespace: string,
  owner: InferenceServiceKind,
  existingSecrets?: SecretKind[],
  opts?: K8sAPIOptions,
): Promise<void> => {
  const { serviceAccountName } = getTokenNames(deployedModelName, namespace);
  const deletedSecrets =
    existingSecrets
      ?.map((secret) => secret.metadata.name)
      .filter(
        (token: string) => !fillData.tokenAuth?.some((tokenEdit) => tokenEdit.k8sName === token),
      ) || [];
  const tokensToProcess = fillData.tokenAuth || [];

  await Promise.all<K8sStatus | SecretKind>([
    ...tokensToProcess.map((token) => {
      const secretToken = addOwnerReference(
        assembleSecretSA(token.displayName, serviceAccountName, namespace, token.k8sName),
        owner,
      );
      if (token.k8sName) {
        return replaceSecret(secretToken, opts);
      }
      return createSecret(secretToken, opts);
    }),
    ...deletedSecrets.map((secret) => deleteSecret(namespace, secret, opts)),
  ]);
};

export const setUpTokenAuth = async (
  fillData: CreatingInferenceServiceObject,
  deployedModelName: string,
  namespace: string,
  createTokenAuth: boolean,
  owner: InferenceServiceKind,
  existingSecrets?: SecretKind[],
  opts?: K8sAPIOptions,
): Promise<void> => {
  const { serviceAccountName, roleName, roleBindingName } = getTokenNames(
    deployedModelName,
    namespace,
  );

  const serviceAccount = addOwnerReference(
    assembleServiceAccount(serviceAccountName, namespace),
    owner,
  );

  // For KServe, we need the inferenceservice view role
  const role = addOwnerReference(
    generateRoleInferenceService(roleName, deployedModelName, namespace),
    owner,
  );

  const roleBinding = addOwnerReference(
    generateRoleBindingServiceAccount(
      roleBindingName,
      serviceAccountName,
      {
        kind: 'Role',
        name: roleName,
      },
      namespace,
    ),
    owner,
  );

  return (
    createTokenAuth
      ? Promise.all([
          createServiceAccountIfMissing(serviceAccount, namespace, opts),
          createRoleIfMissing(role, namespace, opts),
        ]).then(() => createRoleBindingIfMissing(roleBinding, namespace, opts))
      : Promise.resolve()
  )
    .then(() => createSecrets(fillData, deployedModelName, namespace, owner, existingSecrets, opts))
    .catch((error) => Promise.reject(error));
};

export const applyAuth = (
  inferenceService: InferenceServiceKind,
  tokenAuth: boolean,
  externalRoute: boolean,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.metadata.annotations = {
    ...result.metadata.annotations,
    'security.opendatahub.io/enable-auth': tokenAuth ? 'true' : 'false',
  };

  result.metadata.labels = {
    ...result.metadata.labels,
    ...(externalRoute && { 'networking.kserve.io/visibility': 'exposed' }),
  };

  if (!externalRoute) {
    delete result.metadata.labels['networking.kserve.io/visibility'];
  }

  return result;
};

export const applyAiAvailableAssetAnnotations = (
  inferenceService: InferenceServiceKind,
  aiAvailableAsset: ModelAvailabilityFieldsData,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.metadata.labels = {
    ...result.metadata.labels,
    'opendatahub.io/genai-asset': aiAvailableAsset.saveAsAiAsset ? 'true' : 'false',
  };
  if (!aiAvailableAsset.saveAsAiAsset) {
    delete result.metadata.labels['opendatahub.io/genai-asset'];
  }

  result.metadata.annotations = {
    ...result.metadata.annotations,
    ...(aiAvailableAsset.saveAsAiAsset &&
      aiAvailableAsset.useCase && {
        'opendatahub.io/genai-use-case': aiAvailableAsset.useCase,
      }),
  };
  if (!aiAvailableAsset.saveAsAiAsset || !aiAvailableAsset.useCase) {
    delete result.metadata.annotations['opendatahub.io/genai-use-case'];
  }
  return result;
};

export const applyRuntimeArgs = (
  inferenceService: InferenceServiceKind,
  runtimeArgs: RuntimeArgsFieldData,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.spec.predictor.model = {
    ...result.spec.predictor.model,
    ...(runtimeArgs.enabled && { args: runtimeArgs.args }),
  };

  if (!runtimeArgs.enabled) {
    delete result.spec.predictor.model.args;
  }

  return result;
};

export const applyEnvironmentVariables = (
  inferenceService: InferenceServiceKind,
  environmentVariables: EnvironmentVariablesFieldData,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.spec.predictor.model = {
    ...result.spec.predictor.model,
    ...(environmentVariables.enabled && {
      env: environmentVariables.variables.map((envVar) => ({
        name: envVar.name,
        value: envVar.value,
      })),
    }),
  };

  if (!environmentVariables.enabled) {
    delete result.spec.predictor.model.env;
  }

  return result;
};

export const applyModelFormat = (
  inferenceService: InferenceServiceKind,
  modelFormat?: SupportedModelFormats,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.spec.predictor.model = {
    ...result.spec.predictor.model,
    modelFormat: {
      name: modelFormat?.name ?? 'vLLM',
      version: modelFormat?.version,
    },
  };
  return result;
};

export const applyConnectionData = (
  inferenceService: InferenceServiceKind,
  createConnectionData: CreateConnectionData,
  modelLocationData: ModelLocationData,
  dryRun?: boolean,
  secretName?: string,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  if (secretName || createConnectionData.nameDesc?.name) {
    result.metadata.annotations = {
      ...result.metadata.annotations,
    };
    // Apply connection name to the annotations
    if (!dryRun) {
      result.metadata.annotations[MetadataAnnotation.ConnectionName] =
        secretName ?? createConnectionData.nameDesc?.name ?? '';
    }
    // Apply connection path to the annotations if the connection type is S3ObjectStorage
    if (
      modelLocationData.additionalFields.modelPath &&
      isModelServingCompatible(
        modelLocationData.connectionTypeObject ?? [],
        ModelServingCompatibleTypes.S3ObjectStorage,
      )
    ) {
      result.metadata.annotations = {
        ...result.metadata.annotations,
        'opendatahub.io/connection-path': modelLocationData.additionalFields.modelPath,
      };
    } else {
      // Delete connection path from the annotations if it's not present or the connection type is not S3ObjectStorage
      delete result.metadata.annotations['opendatahub.io/connection-path'];
    }
  }
  if (
    modelLocationData.additionalFields.modelUri &&
    isModelServingCompatible(
      modelLocationData.connectionTypeObject ?? [],
      ModelServingCompatibleTypes.OCI,
    )
  ) {
    result.spec.predictor.model = {
      ...result.spec.predictor.model,
      storageUri: modelLocationData.additionalFields.modelUri,
    };
  }
  return result;
};

export const applyDisplayNameDesc = (
  inferenceService: InferenceServiceKind,
  name: string,
  description: string,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.metadata.annotations = {
    ...result.metadata.annotations,
    'openshift.io/display-name': name,
    'openshift.io/description': description,
  };

  return result;
};

export const applyDashboardResourceLabel = (
  inferenceService: InferenceServiceKind,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.metadata.labels = {
    ...result.metadata.labels,
    [KnownLabels.DASHBOARD_RESOURCE]: 'true',
  };
  return result;
};

export const extractModelType = (deployment: {
  model: InferenceServiceKind;
}): ModelTypeFieldData | null => {
  const modelType = deployment.model.metadata.annotations?.['opendatahub.io/model-type'];
  if (modelType && isValidModelType(modelType)) {
    return {
      type: modelType,
      legacyVLLM: modelType === ServingRuntimeModelType.GENERATIVE,
    };
  }
  return null;
};

export const applyModelType = (
  inferenceService: InferenceServiceKind,
  modelType: ServingRuntimeModelType,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  result.metadata.annotations = {
    ...result.metadata.annotations,
    'opendatahub.io/model-type': modelType,
  };
  return result;
};

export const extractDeploymentStrategy = (
  kserveDeployment: KServeDeployment,
): DeploymentStrategyFieldData | null => {
  const { deploymentStrategy } = kserveDeployment.model.spec.predictor;
  if (!deploymentStrategy || typeof deploymentStrategy !== 'object') {
    return null;
  }

  const { type: strategyType } = deploymentStrategy;
  if (strategyType === 'RollingUpdate') {
    return deploymentStrategyRolling;
  }
  return deploymentStrategyRecreate;
};

export const applyDeploymentStrategy = (
  inferenceService: InferenceServiceKind,
  deploymentStrategy?: DeploymentStrategyFieldData,
): InferenceServiceKind => {
  const result = structuredClone(inferenceService);
  if (deploymentStrategy) {
    result.spec.predictor.deploymentStrategy = {
      type: deploymentStrategy === deploymentStrategyRolling ? 'RollingUpdate' : 'Recreate',
    };
  }
  return result;
};
