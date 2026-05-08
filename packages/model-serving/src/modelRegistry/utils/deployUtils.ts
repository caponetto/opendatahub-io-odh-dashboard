// eslint-disable-next-line @odh-dashboard/no-restricted-imports
import type { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import type { ModelDeployPrefillInfo } from '../../pages/screens/projects/usePrefillModelDeployModal';

/**
 * Builds serializable metadata from model registry info.
 *
 * Returns a plain object so it can safely pass through
 * history.pushState (navigation state must be structurally cloneable).
 */
export const getModelRegistryMetadata = (
  modelRegistryInfo: ModelDeployPrefillInfo['modelRegistryInfo'],
): K8sResourceCommon['metadata'] => {
  const { registeredModelId, modelVersionId, mrName } = modelRegistryInfo || {};
  return {
    labels: {
      ...(registeredModelId && {
        'modelregistry.opendatahub.io/registered-model-id': registeredModelId,
      }),
      ...(modelVersionId && {
        'modelregistry.opendatahub.io/model-version-id': modelVersionId,
      }),
      ...(mrName && {
        'modelregistry.opendatahub.io/name': mrName,
      }),
    },
  };
};
