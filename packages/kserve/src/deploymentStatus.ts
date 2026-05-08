import {
  InferenceServiceKind,
  PodKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  checkModelPodStatus,
  getInferenceServiceModelState,
  getInferenceServiceStatusMessage,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/kserveStatusUtils';
import type { DeploymentStatus } from '@odh-dashboard/model-serving-shared/extension-points';
import { k8sPatchResource } from '@odh-dashboard/k8s-browser';
import { InferenceServiceModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kserve';
import { getModelDeploymentStoppedStates } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import { KServeDeployment } from './deployments';

export const patchDeploymentStoppedStatus = (
  deployment: KServeDeployment,
  isStopped: boolean,
): Promise<KServeDeployment['model']> =>
  k8sPatchResource({
    model: InferenceServiceModel,
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

export const getKServeDeploymentStatus = (
  inferenceService: InferenceServiceKind,
  deploymentPods: PodKind[],
): DeploymentStatus => {
  const annotations = inferenceService.metadata.annotations
    ? Object.fromEntries(
        Object.entries(inferenceService.metadata.annotations).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      )
    : undefined;
  const deploymentPod = deploymentPods.find(
    (pod) =>
      pod.metadata.labels?.['serving.kserve.io/inferenceservice'] ===
      inferenceService.metadata.name,
  );
  const modelPodStatus = deploymentPod ? checkModelPodStatus(deploymentPod) : null;

  const state = getInferenceServiceModelState(inferenceService, modelPodStatus);
  const message = getInferenceServiceStatusMessage(inferenceService, modelPodStatus);

  const stoppedStates = getModelDeploymentStoppedStates(state, annotations, deploymentPod);

  return { state, message, stoppedStates };
};
