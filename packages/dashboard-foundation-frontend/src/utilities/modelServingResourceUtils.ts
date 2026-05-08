import { isCpuResourceEqual, isMemoryResourceEqual } from '#~/utilities/valueUnits';
import type { InferenceServiceKind, ModelServingSize, ServingRuntimeKind } from '#~/k8sTypes';
import type { ContainerResources } from '#~/types';

export const getResourceSize = (
  sizes: ModelServingSize[],
  existingResources: ContainerResources,
): ModelServingSize => {
  const size = sizes.find(
    (currentSize) =>
      isCpuResourceEqual(currentSize.resources.limits?.cpu, existingResources.limits?.cpu) &&
      isMemoryResourceEqual(
        currentSize.resources.limits?.memory,
        existingResources.limits?.memory,
      ) &&
      isCpuResourceEqual(currentSize.resources.requests?.cpu, existingResources.requests?.cpu) &&
      isMemoryResourceEqual(
        currentSize.resources.requests?.memory,
        existingResources.requests?.memory,
      ),
  );
  return (
    size || {
      name: 'Custom',
      resources: existingResources,
    }
  );
};

export const getInferenceServiceSizeOrReturnEmpty = (
  inferenceService?: InferenceServiceKind,
): ContainerResources | undefined => {
  if (
    inferenceService?.spec.predictor.model?.resources &&
    Object.keys(inferenceService.spec.predictor.model.resources).length === 0
  ) {
    return undefined;
  }

  return inferenceService?.spec.predictor.model?.resources;
};

export const getServingRuntimeOrReturnEmpty = (
  servingRuntime?: ServingRuntimeKind,
): ContainerResources | undefined => {
  // K8s resources can arrive without spec at runtime (RHOAIENG-32511)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const resources = servingRuntime?.spec?.containers?.[0]?.resources;
  if (resources && Object.keys(resources).length === 0) {
    return undefined;
  }
  return resources;
};

export const getServingRuntimeSize = (
  sizes: ModelServingSize[],
  servingRuntime?: ServingRuntimeKind,
): ModelServingSize => {
  const existingResources = getServingRuntimeOrReturnEmpty(servingRuntime) || sizes[0].resources;
  return getResourceSize(sizes, existingResources);
};

export const getInferenceServiceSize = (
  sizes: ModelServingSize[],
  inferenceService?: InferenceServiceKind,
  servingRuntime?: ServingRuntimeKind,
): ModelServingSize => {
  const existingResources =
    getInferenceServiceSizeOrReturnEmpty(inferenceService) ||
    getServingRuntimeOrReturnEmpty(servingRuntime) ||
    sizes[0].resources;
  return getResourceSize(sizes, existingResources);
};

export const isGpuDisabled = (servingRuntime: ServingRuntimeKind): boolean =>
  servingRuntime.metadata.annotations?.['opendatahub.io/disable-gpu'] === 'true';
