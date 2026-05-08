import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import { useExtensions } from '@odh-dashboard/plugin-core';
import { isModelServingDeploy } from '@odh-dashboard/model-serving-shared/extension-points';
import { useServingRuntimeTemplates } from './servingRuntimeTemplates/useServingRuntimeTemplates';

export const useCanMakeNewDeployment = (
  project?: ProjectKind | null,
): {
  disabled: boolean;
  disabledReason: string;
} => {
  const deployMethods = useExtensions(isModelServingDeploy);
  const isMissingDeployMethods = deployMethods.length === 0;

  const { isKueueDisabled } = useKueueConfiguration(project ?? undefined);

  const [globalTemplates, globalTemplatesLoaded] = useServingRuntimeTemplates();
  const safeGlobalTemplates = globalTemplates ?? [];
  const isMissingTemplates = safeGlobalTemplates.length === 0 && globalTemplatesLoaded;

  const disabled = isMissingTemplates || isKueueDisabled || isMissingDeployMethods;
  const disabledReason = isMissingTemplates
    ? 'At least one serving runtime must be enabled to deploy a model. Contact your administrator.'
    : isKueueDisabled
    ? 'Kueue is not enabled. Contact your administrator.'
    : isMissingDeployMethods
    ? 'At least one model serving platform must be enabled to deploy a model. Contact your administrator.'
    : 'Deploying a model is not possible. Contact your administrator.';

  return { disabled, disabledReason };
};
