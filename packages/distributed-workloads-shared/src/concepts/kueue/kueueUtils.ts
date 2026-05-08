import * as React from 'react';
import {
  useIsAreaAvailable,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import {
  KnownLabels,
  ProjectKind,
  HardwareProfileKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { SchedulingType } from '@odh-dashboard/dashboard-foundation-frontend/types';

export enum KueueFilteringState {
  ONLY_KUEUE_PROFILES = 'only-kueue',
  ONLY_NON_KUEUE_PROFILES = 'only-non-kueue',
  NO_PROFILES = 'no-profiles',
}

export const useKueueConfiguration = (
  project: ProjectKind | undefined,
): {
  isKueueDisabled: boolean;
  isKueueFeatureEnabled: boolean;
  isProjectKueueEnabled: boolean;
  kueueFilteringState: KueueFilteringState;
} => {
  const isKueueFeatureEnabled = useIsAreaAvailable(SupportedArea.KUEUE).status;

  const isProjectKueueEnabled = React.useMemo(
    () => project?.metadata.labels?.[KnownLabels.KUEUE_MANAGED] === 'true',
    [project?.metadata.labels],
  );

  const isKueueDisabled = React.useMemo(
    () => isProjectKueueEnabled && !isKueueFeatureEnabled,
    [isProjectKueueEnabled, isKueueFeatureEnabled],
  );

  const kueueFilteringState = React.useMemo(() => {
    if (isKueueFeatureEnabled && isProjectKueueEnabled) {
      return KueueFilteringState.ONLY_KUEUE_PROFILES;
    }

    if (!isKueueFeatureEnabled && isProjectKueueEnabled) {
      return KueueFilteringState.NO_PROFILES;
    }

    return KueueFilteringState.ONLY_NON_KUEUE_PROFILES;
  }, [isKueueFeatureEnabled, isProjectKueueEnabled]);

  return {
    isKueueDisabled,
    isKueueFeatureEnabled,
    isProjectKueueEnabled,
    kueueFilteringState,
  };
};

export const filterProfilesByKueue = (
  profiles: HardwareProfileKind[],
  kueueFilteringState: KueueFilteringState,
): HardwareProfileKind[] => {
  if (kueueFilteringState === KueueFilteringState.NO_PROFILES) {
    return [];
  }

  return profiles.filter((profile) => {
    const isKueueProfile = profile.spec.scheduling?.type === SchedulingType.QUEUE;
    switch (kueueFilteringState) {
      case KueueFilteringState.ONLY_KUEUE_PROFILES:
        return isKueueProfile;
      case KueueFilteringState.ONLY_NON_KUEUE_PROFILES:
        return !isKueueProfile;
      default:
        return true;
    }
  });
};
