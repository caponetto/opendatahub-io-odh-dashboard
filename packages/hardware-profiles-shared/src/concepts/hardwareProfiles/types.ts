import type { AlertProps } from '@patternfly/react-core';
import {
  AcceleratorProfileKind,
  HardwareProfileFeatureVisibility,
  HardwareProfileKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type {
  ContainerResources,
  HardwarePodSpecOptions,
  NodeSelector,
  Toleration,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { useHardwareProfileConfig } from '#~/concepts/hardwareProfiles/useHardwareProfileConfig';
import type { UseAcceleratorProfileFormResult } from '#~/concepts/hardwareProfiles/deprecated/useAcceleratorProfileFormState';

export enum HardwareProfileBindingState {
  DISABLED = 'Disabled',
  DELETED = 'Deleted',
  UPDATED = 'Updated',
}

export type WarningNotification = {
  title: string;
  message: string;
};

export enum HardwareProfileWarningType {
  HARDWARE_PROFILES_MISSING_CPU_MEMORY = 'hardware_profiles_missing_cpu_memory',
  CANNOT_BE_NEGATIVE = 'cannot_be_negative',
  CANNOT_BE_DECIMAL = 'cannot_be_decimal',
  INVALID_UNIT = 'invalid_unit',
  INVALID_NO = 'invalid_no',
  MISSING_VALUE = 'missing_value',
  OUT_OF_RANGE = 'out_of_range',
  OTHER = 'other',
}

export type PodSpecOptions = {
  resources?: ContainerResources;
  tolerations?: Toleration[];
  nodeSelector?: NodeSelector;
  selectedAcceleratorProfile?: AcceleratorProfileKind;
  selectedHardwareProfile?: HardwareProfileKind;
};

/**
 * @deprecated
 * only in modelmesh deprecation path
 * modelmesh: RHOAIENG-34917, RHOAIENG-19185
 */
export type PodSpecOptionsAcceleratorState<T extends PodSpecOptions> = {
  acceleratorProfile: UseAcceleratorProfileFormResult;
  hardwareProfile: ReturnType<typeof useHardwareProfileConfig>;
  podSpecOptions: T;
};

export type HardwarePodSpecOptionsState<T extends HardwarePodSpecOptions> = {
  hardwareProfile: ReturnType<typeof useHardwareProfileConfig>;
  podSpecOptions: T;
};

export type ResourceType = 'workbench' | 'deployment';

export type HardwareProfileBindingStateInfo = {
  state?: HardwareProfileBindingState;
  profile?: HardwareProfileKind;
};

export type HardwareProfileBindingConfig = {
  labelText: string;
  labelColor: 'red' | 'yellow' | 'green';
  alertVariant: AlertProps['variant'];
  testId: string;
  title: string;
  getBodyText: (params: {
    resourceType: ResourceType;
    isRunning: boolean;
    name?: string;
  }) => string;
};

export type CrPathConfig = {
  containerResourcesPath: string;
  tolerationsPath: string;
  nodeSelectorPath: string;
};

export type HardwareProfileOptions = {
  visibleIn: HardwareProfileFeatureVisibility[];
  paths?: CrPathConfig;
};
