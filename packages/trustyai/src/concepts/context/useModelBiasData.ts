import React from 'react';
import { useParams } from 'react-router-dom';
import type {
  BiasMetricConfig,
  TrustyStatusStates,
  ExplainabilityAPI,
} from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import { TrustyAIContext } from '@odh-dashboard/trustyai/concepts/context/TrustyAIContext';

export type ModelBiasData = {
  biasMetricConfigs: BiasMetricConfig[];
  statusState: TrustyStatusStates;
  refresh: () => Promise<unknown>;
  api: ExplainabilityAPI;
};
export const useModelBiasData = (): ModelBiasData => {
  const { inferenceService } = useParams();

  const { data, statusState, apiState } = React.useContext(TrustyAIContext);

  const biasMetricConfigs = React.useMemo(() => {
    let configs: BiasMetricConfig[] = [];

    if (data.loaded) {
      configs = data.biasMetricConfigs.filter((x) => x.modelId === inferenceService);
    }

    return configs;
  }, [data.biasMetricConfigs, data.loaded, inferenceService]);

  return {
    statusState,
    biasMetricConfigs,
    refresh: data.refresh,
    api: apiState.api,
  };
};
