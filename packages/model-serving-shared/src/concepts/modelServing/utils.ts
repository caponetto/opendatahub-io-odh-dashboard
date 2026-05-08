import type {
  InferenceServiceKind,
  PodKind,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ServingRuntimePlatform } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { ToggleState } from '@odh-dashboard/dashboard-foundation-frontend/components/StateActionToggle';
import { ModelDeploymentState } from './deploymentState';
import type { ServingPlatformStatuses } from './types';

export const isPVCUri = (uri: string): boolean => {
  try {
    const url = new URL(uri);
    return url.protocol === 'pvc:';
  } catch {
    return false;
  }
};

export const getPVCNameFromURI = (uri: string): string => {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'pvc:') {
      return '';
    }
    return url.hostname;
  } catch {
    return '';
  }
};

export const getModelServingRuntimeName = (namespace: string): string =>
  `model-server-${namespace}`;

export const getModelServiceAccountName = (name: string): string => `${name}-sa`;

export const getModelRole = (name: string): string => `${name}-view-role`;

export const getModelRoleBinding = (name: string): string => `${name}-view`;

type TokenNames = {
  serviceAccountName: string;
  roleName: string;
  roleBindingName: string;
};

export const getTokenNames = (servingRuntimeName: string, namespace: string): TokenNames => {
  const name =
    servingRuntimeName !== '' ? servingRuntimeName : getModelServingRuntimeName(namespace);

  const serviceAccountName = getModelServiceAccountName(name);
  const roleName = getModelRole(name);
  const roleBindingName = getModelRoleBinding(name);

  return { serviceAccountName, roleName, roleBindingName };
};

export const isProjectNIMSupported = (currentProject: ProjectKind): boolean =>
  currentProject.metadata.annotations?.['opendatahub.io/nim-support'] === 'true';

export const getProjectModelServingPlatform = (
  project: ProjectKind | null,
  platformStatuses: ServingPlatformStatuses,
): { platform?: ServingRuntimePlatform; error?: Error } => {
  const {
    kServe: { enabled: kServeEnabled, installed: kServeInstalled },
    kServeNIM: { enabled: nimEnabled },
  } = platformStatuses;

  if (!project) {
    return {};
  }

  const hasNIMAnnotation = project.metadata.annotations?.['opendatahub.io/nim-support'] === 'true';

  if (hasNIMAnnotation) {
    return {
      platform: ServingRuntimePlatform.SINGLE,
      error: kServeInstalled ? undefined : new Error('Single-model platform is not installed'),
    };
  }

  if (kServeEnabled && nimEnabled) {
    return {};
  }

  if (kServeEnabled || nimEnabled) {
    return {
      platform: ServingRuntimePlatform.SINGLE,
      error: kServeInstalled ? undefined : new Error('Single-model platform is not installed'),
    };
  }

  return {};
};

export const isModelServingStopped = (modelAnnotations?: Record<string, string>): boolean =>
  modelAnnotations?.['serving.kserve.io/stop'] === 'true';

export const getModelDeploymentStoppedStates = (
  state: ModelDeploymentState,
  modelAnnotations?: Record<string, string>,
  deploymentPod?: PodKind,
): ToggleState => {
  const isStopped = isModelServingStopped(modelAnnotations);
  return {
    isRunning:
      (state === ModelDeploymentState.LOADED || state === ModelDeploymentState.FAILED_TO_LOAD) &&
      !isStopped,
    isStopped: isStopped && !deploymentPod,
    isStarting:
      (state === ModelDeploymentState.PENDING ||
        state === ModelDeploymentState.LOADING ||
        state === ModelDeploymentState.STANDBY ||
        state === ModelDeploymentState.UNKNOWN) &&
      !isStopped,
    isStopping: isStopped && !!deploymentPod,
  };
};

export const isInferenceServiceRouteEnabled = (inferenceService: InferenceServiceKind): boolean =>
  inferenceService.metadata.labels?.['networking.kserve.io/visibility'] === 'exposed';

export const isUrlInternalService = (url: string | undefined): boolean =>
  url !== undefined && url.endsWith('.svc.cluster.local');

export const getUrlFromKserveInferenceService = (
  inferenceService: InferenceServiceKind,
): string | undefined =>
  isUrlInternalService(inferenceService.status?.url) || !inferenceService.status?.url
    ? undefined
    : inferenceService.status.url;
