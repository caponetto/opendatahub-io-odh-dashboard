import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { MlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { Execution, GetExecutionsByContextRequest } from '../../../third_party/mlmd';

export const useExecutionsFromMlmdContext = (
  context: MlmdContext | null,
  refreshRate?: number,
): FetchState<Execution[]> => {
  const { metadataStoreServiceClient } = usePipelinesAPI();

  const call = React.useCallback<FetchStateCallbackPromise<Execution[]>>(async () => {
    if (!context) {
      return Promise.reject(new NotReadyError('No context'));
    }

    const request = new GetExecutionsByContextRequest();
    request.setContextId(context.getId());
    const res = await metadataStoreServiceClient.getExecutionsByContext(request);
    return res.getExecutionsList();
  }, [metadataStoreServiceClient, context]);

  return useFetchState(call, [], {
    refreshRate,
  });
};
