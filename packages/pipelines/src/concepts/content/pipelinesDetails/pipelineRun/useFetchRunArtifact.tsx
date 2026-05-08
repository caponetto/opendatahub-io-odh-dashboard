import React from 'react';
import useFetchState, {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { GetArtifactsRequest } from '../../../../third_party/mlmd';
import {
  Artifact,
  ListOperationOptions,
} from '../../../../third_party/mlmd/generated/ml_metadata/proto/metadata_store_pb';

export const useFetchRunArtifact = (runId?: string): FetchState<Artifact[]> => {
  const { metadataStoreServiceClient } = usePipelinesAPI();

  const fetchArtifacts = React.useCallback(async () => {
    if (!runId) {
      return Promise.reject(new NotReadyError('Run ID is required'));
    }

    const request = new GetArtifactsRequest();
    const options = new ListOperationOptions();

    options.setFilterQuery(`contexts_a.name = '${runId}'`);
    request.setOptions(options);

    const response = await metadataStoreServiceClient.getArtifacts(request);
    return response.getArtifactsList();
  }, [metadataStoreServiceClient, runId]);

  return useFetchState(fetchArtifacts, []);
};
