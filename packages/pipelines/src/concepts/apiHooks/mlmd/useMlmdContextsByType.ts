import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { MlmdContextTypes } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import {
  MetadataStoreServicePromiseClient,
  GetContextsByTypeRequest,
  Context,
} from '../../../third_party/mlmd';

const getMlmdContextsByType = async (
  client: MetadataStoreServicePromiseClient,
  type: MlmdContextTypes,
): Promise<Context[]> => {
  const request = new GetContextsByTypeRequest();
  request.setTypeName(type);
  const res = await client.getContextsByType(request);
  return res.getContextsList();
};

/**
 * A hook used to use the MLMD service and fetch the MLMD context by type
 * If being used without type, this hook will throw an error
 */
export const useMlmdContextsByType = (
  type?: MlmdContextTypes,
  refreshRate?: number,
): FetchState<Context[]> => {
  const { metadataStoreServiceClient } = usePipelinesAPI();

  const call = React.useCallback<FetchStateCallbackPromise<Context[]>>(async () => {
    if (!type) {
      return Promise.reject(new NotReadyError('No context type'));
    }

    const context = await getMlmdContextsByType(metadataStoreServiceClient, type);
    return context;
  }, [metadataStoreServiceClient, type]);

  return useFetchState(call, [], {
    refreshRate,
  });
};
