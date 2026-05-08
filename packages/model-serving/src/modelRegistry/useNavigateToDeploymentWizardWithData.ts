import React from 'react';
import { ServingRuntimeModelType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { DeployPrefillData } from '@odh-dashboard/model-serving-shared/types/deployPrefillData';
import { translateDisplayNameForK8s } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import {
  LimitNameResourceType,
  resourceTypeLimits,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/K8sNameDescriptionField/utils';
import { useWatchConnectionTypes } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useWatchConnectionTypes';
import { ModelLocationType } from '@odh-dashboard/model-serving-shared/concepts/modelServing/modelLocationTypes';
import type { InitialWizardFormData } from '@odh-dashboard/model-serving-shared/types/form-data';
import { ConnectionTypeRefs } from '../components/deploymentWizard/types';
import { useNavigateToDeploymentWizard } from '../components/deploymentWizard/useNavigateToDeploymentWizard';

export const useNavigateToDeploymentWizardWithData = (
  deployPrefillData: DeployPrefillData,
): ((projectName?: string) => void) => {
  const maxLength = resourceTypeLimits[LimitNameResourceType.MODEL_DEPLOYMENT];
  const resourceName = translateDisplayNameForK8s(deployPrefillData.modelName, { maxLength });

  const [connectionTypes, connectionTypesLoaded] = useWatchConnectionTypes(true);
  const uri = deployPrefillData.modelUri;
  let connectionTypeName = ConnectionTypeRefs.URI;

  // Handling S3, URI, and OCI URIs
  if (uri && typeof uri === 'string') {
    const uriProtocol = uri.split('://')[0].toLowerCase();
    if (uriProtocol === 's3') {
      connectionTypeName = ConnectionTypeRefs.S3;
    }
  }
  const connectionTypeObject = React.useMemo(() => {
    return connectionTypes.find((ct) => ct.metadata.name === connectionTypeName);
  }, [connectionTypes, connectionTypeName]);

  const prefillInfo: InitialWizardFormData = React.useMemo(
    () => ({
      wizardStartIndex: deployPrefillData.wizardStartIndex ?? 1,
      modelLocationData: {
        type: ModelLocationType.NEW,
        prefillAlertText: deployPrefillData.prefillAlertText,
        fieldValues: {
          URI: deployPrefillData.modelUri,
        },
        additionalFields: {},
        disableInputFields: true,
        connectionTypeObject,
      },
      createConnectionData: {
        saveConnection: false,
        hideFields: true,
      },
      modelTypeField: {
        type: deployPrefillData.modelType ?? ServingRuntimeModelType.GENERATIVE,
        legacyVLLM: false,
      },
      k8sNameDesc: {
        name: deployPrefillData.modelName,
        description: '',
        k8sName: {
          value: resourceName,
          state: {
            immutable: false,
            invalidCharacters: false,
            invalidLength: false,
            maxLength,
            touched: false,
          },
        },
      },
    }),
    [deployPrefillData, connectionTypeObject, resourceName, maxLength],
  );
  const navigateToWizardInner = useNavigateToDeploymentWizard(
    null,
    prefillInfo,
    deployPrefillData.returnRouteValue,
    deployPrefillData.cancelReturnRouteValue,
  );

  return React.useCallback(
    (projectName?: string) => {
      if (!uri || !connectionTypesLoaded || !connectionTypeObject) {
        // If we don't have all the prefill data, don't navigate to the wizard
        return;
      }
      navigateToWizardInner(projectName);
    },
    [uri, connectionTypesLoaded, connectionTypeObject, navigateToWizardInner],
  );
};
