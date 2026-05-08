import { TrustyAIContextData } from '@odh-dashboard/trustyai/concepts/context/types';

export const DEFAULT_TRUSTY_CONTEXT_DATA: TrustyAIContextData = {
  refresh: () => Promise.resolve(),
  biasMetricConfigs: [],
  loaded: false,
};
