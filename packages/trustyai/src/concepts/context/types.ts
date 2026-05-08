import { BiasMetricConfig } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';

export type TrustyAIContextData = {
  refresh: () => Promise<void>;
  biasMetricConfigs: BiasMetricConfig[];
  loaded: boolean;
  error?: Error;
};
