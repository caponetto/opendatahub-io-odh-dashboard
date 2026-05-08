import React from 'react';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import type { ResolvedExtension } from '@odh-dashboard/plugin-core';
import { TrustyInstallState } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import type { ExplainabilityAPI } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import {
  isModelServingBiasIntegrationExtension,
  type ModelBiasData,
  type ModelServingBiasIntegrationExtension,
} from '@odh-dashboard/model-serving-shared/extension-points';

const NO_OP_API: ExplainabilityAPI = {
  listRequests: () => Promise.resolve({ requests: [] }),
  listSpdRequests: () => Promise.resolve({ requests: [] }),
  listDirRequests: () => Promise.resolve({ requests: [] }),
  createSpdRequest: () => Promise.resolve({ requestId: '', timestamp: '' }),
  createDirRequest: () => Promise.resolve({ requestId: '', timestamp: '' }),
  deleteSpdRequest: () => Promise.resolve(),
  deleteDirRequest: () => Promise.resolve(),
};

const EMPTY_BIAS_DATA: ModelBiasData = {
  biasMetricConfigs: [],
  statusState: { type: TrustyInstallState.LOADING_INITIAL_STATE },
  refresh: () => Promise.resolve(undefined),
  api: NO_OP_API,
};

type BiasIntegration = ResolvedExtension<ModelServingBiasIntegrationExtension>['properties'] | null;

export const useBiasIntegration = (): [BiasIntegration, boolean] => {
  const [extensions, loaded] = useResolvedExtensions(isModelServingBiasIntegrationExtension);
  const integration = extensions.length > 0 ? extensions[0].properties : null;
  return [integration, loaded];
};

export const useModelBiasData = (): ModelBiasData => {
  const [integration] = useBiasIntegration();
  if (!integration) {
    return EMPTY_BIAS_DATA;
  }
  return integration.useModelBiasData();
};

export const useIsBiasAvailable = (): boolean => {
  const [integration, loaded] = useBiasIntegration();
  if (!loaded || !integration) {
    return false;
  }
  return integration.useIsBiasAvailable();
};

export const BiasContextProviderWrapper: React.FC<{
  namespace: string;
  children: React.ReactNode;
}> = ({ namespace, children }) => {
  const [integration, loaded] = useBiasIntegration();
  if (!loaded || !integration) {
    return <>{children}</>;
  }
  const { ContextProvider } = integration;
  return <ContextProvider namespace={namespace}>{children}</ContextProvider>;
};
