import React from 'react';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import type { ResolvedExtension } from '@odh-dashboard/plugin-core';
import type { WizardFormData } from '@odh-dashboard/model-serving-shared/types/form-data';
import {
  DeploymentAssemblyResources,
  isModelServingDeploy,
  type Deployment,
  type ModelServingDeploy,
} from '@odh-dashboard/model-serving-shared/extension-points';

export type DeployExtension = ResolvedExtension<ModelServingDeploy<Deployment>>['properties'];

export const useDeployMethod = (
  wizardData: WizardFormData['state'],
  resources?: DeploymentAssemblyResources,
): {
  deployMethod?: ResolvedExtension<ModelServingDeploy<Deployment>>;
  deployMethodLoaded: boolean;
  deployMethodErrors: Error[];
} => {
  const [deployExtensions, deployExtensionsLoaded, deployExtensionsErrors] =
    useResolvedExtensions(isModelServingDeploy);

  return React.useMemo(() => {
    const sortedDeployExtensions = deployExtensions
      .filter((e) =>
        typeof e.properties.isActive === 'function'
          ? e.properties.isActive(wizardData, resources)
          : e.properties.isActive,
      )
      .toSorted((a, b) => b.properties.priority - a.properties.priority);

    return {
      deployMethod: sortedDeployExtensions.length > 0 ? sortedDeployExtensions[0] : undefined,
      deployMethodLoaded: deployExtensionsLoaded,
      deployMethodErrors: deployExtensionsErrors.filter(
        (error): error is Error => error instanceof Error,
      ),
    };
  }, [deployExtensions, deployExtensionsErrors, deployExtensionsLoaded, wizardData, resources]);
};
