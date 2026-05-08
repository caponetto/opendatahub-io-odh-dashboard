import React from 'react';
import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import type { HardwarePodSpecOptions } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  useHardwareProfileConfig,
  UseHardwareProfileConfigResult,
} from '#~/concepts/hardwareProfiles/useHardwareProfileConfig';
import {
  HardwarePodSpecOptionsState,
  HardwareProfileOptions,
  CrPathConfig,
} from '#~/concepts/hardwareProfiles/types';
import { isHardwareProfileConfigValid } from '#~/concepts/hardwareProfiles/validationUtils';
import {
  applyHardwareProfileConfig,
  assemblePodSpecOptions,
  getExistingHardwareProfileData,
  getExistingResources,
} from '#~/concepts/hardwareProfiles/utils';

export type UseAssignHardwareProfileResult<T extends K8sResourceCommon> = {
  podSpecOptionsState: HardwarePodSpecOptionsState<HardwarePodSpecOptions>;
  applyToResource: <R extends T>(resource: R, runtimePaths?: CrPathConfig) => R;
  validateHardwareProfileForm: () => boolean;
  loaded: boolean;
  error?: Error;
};

export const useAssignHardwareProfile = <T extends K8sResourceCommon>(
  cr: T | null | undefined,
  hardwareProfileOptions: HardwareProfileOptions,
): UseAssignHardwareProfileResult<T> => {
  const { visibleIn, paths } = hardwareProfileOptions;
  const { name: hwpName, namespace: hwpNamespace } = getExistingHardwareProfileData(cr);
  const existingResources = getExistingResources(cr, paths);
  const { existingContainerResources, existingTolerations, existingNodeSelector } =
    existingResources;
  const namespace = cr?.metadata?.namespace;
  const hardwareProfileConfig: UseHardwareProfileConfigResult = useHardwareProfileConfig(
    hwpName,
    existingContainerResources,
    existingTolerations,
    existingNodeSelector,
    visibleIn,
    namespace,
    hwpNamespace,
  );
  const podSpecOptions = assemblePodSpecOptions(hardwareProfileConfig, existingResources);

  const podSpecOptionsState: HardwarePodSpecOptionsState<HardwarePodSpecOptions> = {
    hardwareProfile: hardwareProfileConfig,
    podSpecOptions,
  };

  const applyToResource = React.useCallback(
    <R extends T>(targetResource: R, resourcePaths?: CrPathConfig): R => {
      return applyHardwareProfileConfig(
        targetResource,
        hardwareProfileConfig.formData,
        resourcePaths || paths,
      );
    },
    [paths, hardwareProfileConfig.formData],
  );

  const validateHardwareProfileForm = React.useCallback((): boolean => {
    return isHardwareProfileConfigValid(hardwareProfileConfig.formData);
  }, [hardwareProfileConfig.formData]);

  return {
    podSpecOptionsState,
    applyToResource,
    validateHardwareProfileForm,
    loaded: hardwareProfileConfig.profilesLoaded,
    error: hardwareProfileConfig.profilesLoadError,
  };
};
