import React from 'react';
import {
  InferenceServiceKind,
  K8sAPIOptions,
  ProjectKind,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { Deployment } from '@odh-dashboard/model-serving-shared/extension-points';
import {
  deleteInferenceService,
  getInferenceService,
  getInferenceServicePods,
} from '@odh-dashboard/model-serving-shared/api/k8s/inferenceServices';
import { deleteServingRuntime } from '@odh-dashboard/model-serving-shared/api/k8s/servingRuntimes';
import { getAPIProtocolFromServingRuntime } from '@odh-dashboard/model-serving-shared/concepts/modelServing/servingRuntimeUtils';
import { getKServeDeploymentEndpoints } from './deploymentEndpoints';
import {
  useWatchDeploymentPods,
  useWatchServingRuntimes,
  useWatchInferenceServices,
} from './api/watch';
import { getKServeDeploymentStatus } from './deploymentStatus';
import { KSERVE_ID } from './extensions';

export type KServeDeployment = Deployment<InferenceServiceKind, ServingRuntimeKind>;
export const isKServeDeployment = (deployment: Deployment): deployment is KServeDeployment =>
  deployment.modelServingPlatformId === KSERVE_ID;

export const useWatchDeployments = (
  project: ProjectKind,
  labelSelectors?: { [key: string]: string },
  filterFn?: (inferenceService: InferenceServiceKind) => boolean,
  opts?: K8sAPIOptions,
): [KServeDeployment[] | undefined, boolean, Error[] | undefined] => {
  const [inferenceServices, inferenceServiceLoaded, inferenceServiceError] =
    useWatchInferenceServices(project, labelSelectors, opts);
  const [servingRuntimes, servingRuntimeLoaded, servingRuntimeError] = useWatchServingRuntimes(
    project,
    opts,
  );
  const [deploymentPods, deploymentPodsLoaded, deploymentPodsError] = useWatchDeploymentPods(
    project,
    opts,
  );
  const safeInferenceServices = React.useMemo(() => inferenceServices ?? [], [inferenceServices]);
  const safeServingRuntimes = React.useMemo(() => servingRuntimes ?? [], [servingRuntimes]);
  const safeDeploymentPods = React.useMemo(() => deploymentPods ?? [], [deploymentPods]);

  const filteredInferenceServices = React.useMemo(() => {
    if (!filterFn) {
      return safeInferenceServices;
    }
    return safeInferenceServices.filter(filterFn);
  }, [safeInferenceServices, filterFn]);

  const deployments: KServeDeployment[] = React.useMemo(
    () =>
      filteredInferenceServices.map((inferenceService) => {
        const servingRuntime = safeServingRuntimes.find(
          (sr) => sr.metadata.name === inferenceService.spec.predictor.model?.runtime,
        );
        return {
          modelServingPlatformId: KSERVE_ID,
          model: inferenceService,
          server: servingRuntime,
          status: getKServeDeploymentStatus(inferenceService, safeDeploymentPods),
          endpoints: getKServeDeploymentEndpoints(inferenceService),
          apiProtocol: servingRuntime
            ? getAPIProtocolFromServingRuntime(servingRuntime)
            : undefined,
        };
      }),
    [filteredInferenceServices, safeServingRuntimes, safeDeploymentPods],
  );

  const effectivelyLoaded = Boolean(
    (inferenceServiceLoaded || inferenceServiceError) &&
      (servingRuntimeLoaded || servingRuntimeError) &&
      (deploymentPodsLoaded || deploymentPodsError),
  );

  const errors = React.useMemo(() => {
    return [inferenceServiceError, servingRuntimeError, deploymentPodsError].filter(
      (error): error is Error => Boolean(error),
    );
  }, [inferenceServiceError, servingRuntimeError, deploymentPodsError]);

  return [deployments, effectivelyLoaded, errors];
};

export const fetchDeploymentStatus = async (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<KServeDeployment | null> => {
  try {
    const inferenceService = await getInferenceService(name, namespace, opts);

    const deploymentPods = await getInferenceServicePods(name, namespace);

    const deployment: KServeDeployment = {
      modelServingPlatformId: KSERVE_ID,
      model: inferenceService,
      status: getKServeDeploymentStatus(inferenceService, deploymentPods),
    };

    return deployment;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const deleteDeployment = async (deployment: KServeDeployment): Promise<void> => {
  await Promise.all([
    deleteInferenceService(deployment.model.metadata.name, deployment.model.metadata.namespace),
    ...(deployment.server
      ? [
          deleteServingRuntime(
            deployment.server.metadata.name,
            deployment.server.metadata.namespace,
          ),
        ]
      : []),
  ]);
};
