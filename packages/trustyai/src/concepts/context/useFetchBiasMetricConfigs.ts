import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { BiasMetricConfig } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import { TrustyAPIState } from '@odh-dashboard/trustyai/concepts/useTrustyAIAPIState';
import { formatListResponse } from '@odh-dashboard/trustyai/concepts/utils';

const useFetchBiasMetricConfigs = (apiState: TrustyAPIState): FetchState<BiasMetricConfig[]> => {
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
  const callback = React.useCallback<FetchStateCallbackPromise<BiasMetricConfig[]>>(
    (opts) => {
      if (!biasMetricsAreaAvailable) {
        return Promise.reject(new NotReadyError('Bias metrics is not enabled'));
      }
      if (!apiState.apiAvailable) {
        return Promise.reject(new NotReadyError('API not yet available'));
      }
      return apiState.api.listRequests(opts).then((r) => formatListResponse(r));
    },
    [apiState.api, apiState.apiAvailable, biasMetricsAreaAvailable],
  );

  return useFetchState(callback, [], { initialPromisePurity: true });
};

export default useFetchBiasMetricConfigs;
