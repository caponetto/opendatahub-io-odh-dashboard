import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import { UseAssignHardwareProfileResult } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useAssignHardwareProfile';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { ContainerResources, Toleration, NodeSelector } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { applyHardwareProfileConfig } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/utils';
import { NOTEBOOK_HARDWARE_PROFILE_PATHS } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/notebookPaths';
import type { CrPathConfig } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/types';

type MockHardwareProfileOptionsConfig = {
  selectedHardwareProfile?: HardwareProfileKind;
  resources?: ContainerResources;
  tolerations?: Toleration[];
  nodeSelector?: NodeSelector;
  paths?: CrPathConfig;
};

export const mockUseAssignHardwareProfileResult = <T extends K8sResourceCommon>({
  selectedHardwareProfile,
  resources = {
    requests: {
      memory: '2Gi',
      cpu: '500m',
    },
    limits: {
      memory: '2Gi',
      cpu: '500m',
    },
  },
  tolerations = [],
  nodeSelector = {},
  paths = NOTEBOOK_HARDWARE_PROFILE_PATHS,
}: MockHardwareProfileOptionsConfig = {}): UseAssignHardwareProfileResult<T> => {
  const formData = {
    selectedProfile: selectedHardwareProfile,
    useExistingSettings: false,
    resources,
  };

  return {
    podSpecOptionsState: {
      hardwareProfile: {
        formData,
        initialHardwareProfile: selectedHardwareProfile,
        isFormDataValid: true,
        setFormData: () => {
          // Mock function
        },
        resetFormData: () => {
          // Mock function
        },
        profilesLoaded: true,
        profilesLoadError: undefined,
      },
      podSpecOptions: {
        resources,
        tolerations,
        nodeSelector,
        selectedHardwareProfile,
      },
    },
    applyToResource: <R extends T>(resource: R): R => {
      return applyHardwareProfileConfig(resource, formData, paths);
    },
    validateHardwareProfileForm: () => true,
    loaded: true,
    error: undefined,
  };
};
