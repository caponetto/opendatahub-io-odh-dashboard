import type { DeploymentStatus } from '@odh-dashboard/model-serving-shared/extension-points';
import { ModelDeploymentState } from '@odh-dashboard/model-serving-shared/concepts/modelServing/deploymentState';
import type { ModelStatus } from '@odh-dashboard/model-serving-shared/concepts/modelServing/types';
import { k8sPatchResource } from '@odh-dashboard/k8s-browser';
import { K8sAPIOptions, PodKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { checkModelPodStatus } from '@odh-dashboard/model-serving-shared/concepts/modelServing/kserveStatusUtils';
import { PodModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/k8s';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { getModelDeploymentStoppedStates } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import {
  LLMdDeployment,
  LLMInferenceServiceKind,
  LLMInferenceServiceModel,
  LLMInferenceServiceReadyConditionReason,
} from '../types';

export const useLLMInferenceServicePods = (
  namespace: string,
  opts?: K8sAPIOptions,
): CustomWatchK8sResult<PodKind[]> =>
  useK8sWatchResourceList<PodKind[]>(
    {
      isList: true,
      groupVersionKind: groupVersionKind(PodModel),
      namespace,
      selector: {
        matchLabels: {
          'app.kubernetes.io/component': 'llminferenceservice-workload',
        },
      },
    },
    PodModel,
    opts,
  );

export const getLLMdDeploymentStatus = (
  inferenceService: LLMInferenceServiceKind,
  deploymentPods: PodKind[],
): DeploymentStatus => {
  const annotations = inferenceService.metadata.annotations
    ? Object.fromEntries(
        Object.entries(inferenceService.metadata.annotations).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      )
    : undefined;
  const deploymentPod = deploymentPods.length > 0 ? deploymentPods[0] : undefined;

  const modelPodStatus = deploymentPod ? checkModelPodStatus(deploymentPod) : undefined;

  const state = getLLMInferenceServiceModelState(inferenceService, modelPodStatus);
  const message = getLLMInferenceServiceStatusMessage(inferenceService, modelPodStatus);

  const stoppedStates = getModelDeploymentStoppedStates(state, annotations, deploymentPod);

  return { state, message, stoppedStates };
};

export const patchDeploymentStoppedStatus = (
  deployment: LLMdDeployment,
  isStopped: boolean,
): Promise<LLMdDeployment['model']> =>
  k8sPatchResource({
    model: LLMInferenceServiceModel,
    queryOptions: {
      name: deployment.model.metadata.name,
      ns: deployment.model.metadata.namespace,
    },
    patches: [
      {
        op: 'add',
        path: '/metadata/annotations/serving.kserve.io~1stop',
        value: isStopped ? 'true' : 'false',
      },
    ],
  });

export const getLLMInferenceServiceModelState = (
  is: LLMInferenceServiceKind,
  modelPodStatus?: ModelStatus | null,
): ModelDeploymentState => {
  const readyCondition = is.status?.conditions?.find((condition) => condition.type === 'Ready');
  if (modelPodStatus?.failedToSchedule) {
    return ModelDeploymentState.FAILED_TO_LOAD;
  }
  switch (readyCondition?.status) {
    case 'False':
      if (
        readyCondition.reason === LLMInferenceServiceReadyConditionReason.PROGRESS_DEADLINE_EXCEEDED
      ) {
        return ModelDeploymentState.FAILED_TO_LOAD;
      }
      if (readyCondition.reason === LLMInferenceServiceReadyConditionReason.STOPPED) {
        // if the service is actually stopped it overrides this, checking for stopped here prevents a false failure while the status is updating after hitting start
        return ModelDeploymentState.PENDING;
      }
      return ModelDeploymentState.PENDING;
    case 'True':
      return ModelDeploymentState.LOADED;
    default:
      return ModelDeploymentState.UNKNOWN;
  }
};

export const getLLMInferenceServiceStatusMessage = (
  is: LLMInferenceServiceKind,
  modelPodStatus?: ModelStatus | null,
): string => {
  if (modelPodStatus?.failedToSchedule) {
    return modelPodStatus.failureMessage || 'Insufficient resources';
  }
  const stateMessage =
    is.status?.conditions?.find((condition) => condition.type === 'Ready')?.message ?? 'Unknown';

  return stateMessage;
};
