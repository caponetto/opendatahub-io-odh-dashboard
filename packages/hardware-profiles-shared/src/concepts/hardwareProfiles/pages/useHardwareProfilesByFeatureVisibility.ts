import React from 'react';
import {
  HardwareProfileKind,
  HardwareProfileFeatureVisibility,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import {
  filterRecognizedVisibility,
  isHardwareProfileValid,
} from '#~/concepts/hardwareProfiles/pages/utils';
import { HardwareProfilesContext } from '#~/concepts/hardwareProfiles/HardwareProfilesContext';
import { useWatchHardwareProfiles } from '#~/utilities/useWatchHardwareProfiles';

/**
 * Hook to get hardware profiles filtered by feature visibility.
 *
 * Simple logic:
 * 1. Global profiles - always from HardwareProfilesContext (dashboard namespace)
 * 2. Project profiles:
 *    - If in ProjectDetailsContext and namespace matches (or no namespace) → use context
 *    - Otherwise, fetch for the specific namespace
 *
 * Note: This may create duplicate watches in some cases (e.g., global deployments table),
 * but that's acceptable as React hooks will be memoized per component instance and
 * the complexity of trying to avoid it is not worth the maintenance burden.
 *
 * @param visibility - Feature visibility filter
 * @param namespace - Optional namespace for project-scoped profiles
 */
export const useHardwareProfilesByFeatureVisibility = (
  visibility?: HardwareProfileFeatureVisibility[],
  namespace?: string,
): {
  projectProfiles: [data: HardwareProfileKind[], loaded: boolean, loadError: Error | undefined];
  globalProfiles: [data: HardwareProfileKind[], loaded: boolean, loadError: Error | undefined];
} => {
  const { dashboardNamespace } = useDashboardNamespace();

  const {
    globalHardwareProfiles: [globalProfiles, globalProfilesLoaded, globalProfilesError],
  } = React.useContext(HardwareProfilesContext);

  const { currentProject, projectHardwareProfiles: contextProjectProfiles } =
    React.useContext(ProjectDetailsContext);
  const [contextProjectProfilesData, contextProjectProfilesLoaded, contextProjectProfilesError] =
    contextProjectProfiles;

  const shouldUseContextProfiles =
    !!currentProject.metadata.name && (!namespace || currentProject.metadata.name === namespace);
  const shouldFetchProfiles =
    namespace && namespace !== dashboardNamespace && !shouldUseContextProfiles;

  const namespaceToWatch = shouldFetchProfiles ? namespace : undefined;
  const [fetchedProfilesData, fetchedProfilesLoaded, fetchedProfilesError] =
    useWatchHardwareProfiles(namespaceToWatch);

  const projectProfilesResult = React.useMemo<
    [HardwareProfileKind[], boolean, Error | undefined]
  >(() => {
    if (shouldUseContextProfiles) {
      return [
        contextProjectProfilesData ?? [],
        contextProjectProfilesLoaded,
        contextProjectProfilesError,
      ];
    }
    if (shouldFetchProfiles) {
      return [fetchedProfilesData ?? [], fetchedProfilesLoaded, fetchedProfilesError];
    }
    return [[], true, undefined];
  }, [
    shouldUseContextProfiles,
    shouldFetchProfiles,
    contextProjectProfilesData,
    contextProjectProfilesLoaded,
    contextProjectProfilesError,
    fetchedProfilesData,
    fetchedProfilesLoaded,
    fetchedProfilesError,
  ]);

  const [projectProfiles, projectProfilesLoaded, projectProfilesError] = projectProfilesResult;

  const projectProfilesFiltered = React.useMemo(
    () => filterHardwareProfileByFeatureVisibility(projectProfiles, visibility),
    [projectProfiles, visibility],
  );
  const globalProfilesFiltered = React.useMemo(
    () => filterHardwareProfileByFeatureVisibility(globalProfiles ?? [], visibility),
    [globalProfiles, visibility],
  );
  return {
    projectProfiles: [projectProfilesFiltered, projectProfilesLoaded, projectProfilesError],
    globalProfiles: [globalProfilesFiltered, globalProfilesLoaded, globalProfilesError],
  };
};

export const filterHardwareProfileByFeatureVisibility = (
  hardwareProfiles: HardwareProfileKind[],
  visibility?: HardwareProfileFeatureVisibility[],
): HardwareProfileKind[] => {
  const validHardwareProfiles = hardwareProfiles.filter((profile) =>
    isHardwareProfileValid(profile),
  );

  const filteredHardwareProfiles = validHardwareProfiles.filter((profile) => {
    try {
      if (!profile.metadata.annotations?.['opendatahub.io/dashboard-feature-visibility']) {
        return true;
      }

      const visibleIn: string[] = JSON.parse(
        profile.metadata.annotations['opendatahub.io/dashboard-feature-visibility'],
      );

      const recognized = filterRecognizedVisibility(visibleIn);

      if (recognized.length === 0) {
        return true;
      }

      return visibility ? visibility.some((a) => recognized.includes(a)) : true;
    } catch (error) {
      return true;
    }
  });

  return filteredHardwareProfiles;
};
