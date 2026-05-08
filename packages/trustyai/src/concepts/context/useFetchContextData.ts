import React from 'react';
import { TrustyAPIState } from '@odh-dashboard/trustyai/concepts/useTrustyAIAPIState';
import { TrustyAIContextData } from '@odh-dashboard/trustyai/concepts/context/types';
import useFetchBiasMetricConfigs from '@odh-dashboard/trustyai/concepts/context/useFetchBiasMetricConfigs';

const useFetchContextData = (apiState: TrustyAPIState): TrustyAIContextData => {
  const [biasMetricConfigs, biasMetricConfigsLoaded, error, refreshBiasMetricConfigs] =
    useFetchBiasMetricConfigs(apiState);

  const refresh = React.useCallback(
    () => refreshBiasMetricConfigs().then(() => undefined),
    [refreshBiasMetricConfigs],
  );

  return {
    biasMetricConfigs,
    refresh,
    loaded: biasMetricConfigsLoaded,
    error,
  };
};

export default useFetchContextData;
