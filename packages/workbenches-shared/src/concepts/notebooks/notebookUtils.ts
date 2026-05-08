import React from 'react';
import {
  HardwareProfileFeatureVisibility,
  NotebookKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { Notebook } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  useAssignHardwareProfile,
  UseAssignHardwareProfileResult,
} from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useAssignHardwareProfile';
import { NOTEBOOK_HARDWARE_PROFILE_PATHS } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/notebookPaths';

export const getRoutePathForWorkbench = (
  workbenchNamespace: string,
  workbenchName: string,
): string => `/notebook/${workbenchNamespace}/${workbenchName}`;

export const isWorkbenchMigrated = (
  notebook: NotebookKind | Notebook | null | undefined,
): boolean => notebook?.metadata.annotations?.['notebooks.opendatahub.io/inject-auth'] === 'true';

export const getNotebookResourcesPath = (
  notebook: NotebookKind | Notebook | null | undefined,
): string => {
  if (!notebook) return NOTEBOOK_HARDWARE_PROFILE_PATHS.containerResourcesPath;
  const containerIndex = notebook.spec.template.spec.containers.findIndex(
    (container) => container.name === notebook.metadata.name,
  );

  return `spec.template.spec.containers.${containerIndex >= 0 ? containerIndex : 0}.resources`;
};

export const useNotebookHardwareProfile = <T extends NotebookKind | Notebook>(
  notebook: T | null | undefined,
): UseAssignHardwareProfileResult<T> => {
  const paths = React.useMemo(
    () => ({
      ...NOTEBOOK_HARDWARE_PROFILE_PATHS,
      containerResourcesPath: getNotebookResourcesPath(notebook),
    }),
    [notebook],
  );

  return useAssignHardwareProfile(notebook, {
    visibleIn: [HardwareProfileFeatureVisibility.WORKBENCH],
    paths,
  });
};
