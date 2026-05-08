import React from 'react';
import type {
  K8sAPIOptions,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getLLMdDeploymentEndpoints } from './endpoints';
import { getLLMdDeploymentStatus, useLLMInferenceServicePods } from './status';
import { type LLMdDeployment, type LLMInferenceServiceKind } from '../types';
import { LLMD_SERVING_ID } from '../extensions/extensions';
import { useWatchLLMInferenceService } from '../api/LLMInferenceService';
import { useWatchLLMInferenceServiceConfigs } from '../api/LLMInferenceServiceConfigs';

export const useWatchDeployments = (
  project: ProjectKind,
  labelSelectors?: { [key: string]: string },
  filterFn?: (llmInferenceService: LLMInferenceServiceKind) => boolean,
  opts?: K8sAPIOptions,
): [LLMdDeployment[] | undefined, boolean, Error[] | undefined] => {
  const [llmInferenceServices, llmInferenceServiceLoaded, llmInferenceServiceError] =
    useWatchLLMInferenceService(project.metadata.name, opts, labelSelectors);
  const safeLLMInferenceServices = React.useMemo(
    () => llmInferenceServices ?? [],
    [llmInferenceServices],
  );

  const filteredLLMInferenceServices = React.useMemo(
    () => (filterFn ? safeLLMInferenceServices.filter(filterFn) : safeLLMInferenceServices),
    [safeLLMInferenceServices, filterFn],
  );

  const [
    llmInferenceServiceConfigs,
    llmInferenceServiceConfigsLoaded,
    llmInferenceServiceConfigsError,
  ] = useWatchLLMInferenceServiceConfigs(project.metadata.name, opts);

  const [deploymentPods, deploymentPodsLoaded, deploymentPodsError] = useLLMInferenceServicePods(
    project.metadata.name,
    opts,
  );
  const safeDeploymentPods = React.useMemo(() => deploymentPods ?? [], [deploymentPods]);
  const safeLLMInferenceServiceConfigs = React.useMemo(
    () => llmInferenceServiceConfigs ?? [],
    [llmInferenceServiceConfigs],
  );

  const deployments = React.useMemo(() => {
    return filteredLLMInferenceServices.map((llmInferenceService) => {
      const pods = safeDeploymentPods.filter(
        (pod) =>
          pod.metadata.labels?.['app.kubernetes.io/name'] === llmInferenceService.metadata.name &&
          pod.metadata.labels['app.kubernetes.io/component'] === 'llminferenceservice-workload',
      );

      const matchingBaseRefConfig = llmInferenceService.spec.baseRefs?.find(
        (baseRef) => baseRef.name === llmInferenceService.metadata.name,
      );

      return {
        modelServingPlatformId: LLMD_SERVING_ID,
        model: llmInferenceService,
        server: matchingBaseRefConfig
          ? safeLLMInferenceServiceConfigs.find(
              (config) => config.metadata.name === matchingBaseRefConfig.name,
            )
          : undefined,
        apiProtocol: 'REST', // vLLM uses REST so I assume it's the same for LLMd
        endpoints: getLLMdDeploymentEndpoints(llmInferenceService),
        status: getLLMdDeploymentStatus(llmInferenceService, pods),
      };
    });
  }, [filteredLLMInferenceServices, safeDeploymentPods, safeLLMInferenceServiceConfigs]);

  const effectivelyLoaded = Boolean(
    (llmInferenceServiceLoaded || llmInferenceServiceError) &&
      (llmInferenceServiceConfigsLoaded || llmInferenceServiceConfigsError) &&
      (deploymentPodsLoaded || deploymentPodsError),
  );

  const errors = React.useMemo(() => {
    return [llmInferenceServiceError, llmInferenceServiceConfigsError, deploymentPodsError].filter(
      (error): error is Error => Boolean(error),
    );
  }, [llmInferenceServiceError, llmInferenceServiceConfigsError, deploymentPodsError]);

  return React.useMemo(
    () => [deployments, effectivelyLoaded, errors],
    [deployments, effectivelyLoaded, errors],
  );
};
