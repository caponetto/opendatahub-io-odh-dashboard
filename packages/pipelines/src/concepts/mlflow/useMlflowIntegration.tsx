import React from 'react';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import type { ResolvedExtension } from '@odh-dashboard/plugin-core';
import type { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type { MlflowExperiment } from '@odh-dashboard/mlflow-shared/concepts/mlflow/types';
import {
  isPipelinesMlflowIntegrationExtension,
  type MlflowExperimentSelectorProps,
  type PipelinesMlflowIntegrationExtension,
} from '@odh-dashboard/pipelines-shared/concepts/pipelines/extension-points';

type MlflowIntegration =
  | ResolvedExtension<PipelinesMlflowIntegrationExtension>['properties']
  | null;

const EMPTY_EXPERIMENTS: FetchStateObject<MlflowExperiment[]> = {
  data: [],
  loaded: true,
  error: undefined,
  refresh: () => Promise.resolve(undefined),
};

export const useMlflowIntegration = (): [MlflowIntegration, boolean] => {
  const [extensions, loaded] = useResolvedExtensions(isPipelinesMlflowIntegrationExtension);
  const integration = extensions.length > 0 ? extensions[0].properties : null;
  return [integration, loaded];
};

export const useMlflowExperiments = (opts: {
  workspace: string;
  filter?: string;
}): FetchStateObject<MlflowExperiment[]> => {
  const [integration] = useMlflowIntegration();
  if (!integration) {
    return EMPTY_EXPERIMENTS;
  }
  return integration.useMlflowExperiments(opts);
};

export const useIsMlflowCRAvailable = (): { available: boolean; loaded: boolean } => {
  const [integration, loaded] = useMlflowIntegration();
  if (!loaded || !integration) {
    return { available: false, loaded };
  }
  return integration.useIsMlflowCRAvailable();
};

export const MlflowExperimentSelector: React.FC<MlflowExperimentSelectorProps> = (props) => {
  const [integration] = useMlflowIntegration();
  if (!integration) {
    return null;
  }
  const { MlflowExperimentSelector: Selector } = integration;
  return <Selector {...props} />;
};
