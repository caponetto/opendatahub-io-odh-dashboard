import type { Extension, CodeRef } from '@odh-dashboard/plugin-core';
import type { DeployPrefillData } from '@odh-dashboard/model-serving-shared/types/deployPrefillData';

export type NavigateToDeploymentWizardWithDataExtension = Extension<
  'model-catalog.deployment/navigate-wizard',
  {
    useAvailablePlatformIds: CodeRef<() => string[]>;
    useNavigateToDeploymentWizardWithData: CodeRef<
      (deployPrefillData: DeployPrefillData) => (projectName?: string) => void
    >;
  }
>;

export const isNavigateToDeploymentWizardWithDataExtension = (
  extension: Extension,
): extension is NavigateToDeploymentWizardWithDataExtension =>
  extension.type === 'model-catalog.deployment/navigate-wizard';
