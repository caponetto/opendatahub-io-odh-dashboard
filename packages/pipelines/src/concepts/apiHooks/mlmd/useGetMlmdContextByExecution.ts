import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import {
  MlmdContext,
  MlmdContextTypes,
} from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/types';
import { useGetMlmdContextType } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useGetMlmdContextType';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

import { GetContextsByExecutionRequest } from '../../../third_party/mlmd/generated/ml_metadata/proto/metadata_store_service_pb';

const useGetMlmdContextByExecution = (
  executionId: number | undefined,
  type?: MlmdContextTypes,
): FetchState<MlmdContext | null> => {
  const { metadataStoreServiceClient } = usePipelinesAPI();
  const [contextType] = useGetMlmdContextType(type);

  const contextTypeId = contextType?.getId();

  const call = React.useCallback<FetchStateCallbackPromise<MlmdContext | null>>(async () => {
    if (!executionId) {
      throw new Error(`execution id not available`);
    }

    const request = new GetContextsByExecutionRequest();

    request.setExecutionId(executionId);

    const response = await metadataStoreServiceClient.getContextsByExecution(request);

    const result = response.getContextsList().filter((c) => c.getTypeId() === contextTypeId);

    return result.length === 1 ? result[0] : null;
  }, [executionId, metadataStoreServiceClient, contextTypeId]);

  return useFetchState(call, null);
};

export const useGetPipelineRunContextByExecution = (
  executionId: number | undefined,
): FetchState<MlmdContext | null> =>
  useGetMlmdContextByExecution(executionId, MlmdContextTypes.RUN);
