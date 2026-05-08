import React from 'react';
import { APIState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/proxy/types';
import useAPIState from '@odh-dashboard/dashboard-foundation-frontend/concepts/proxy/useAPIState';
import { ExplainabilityAPI } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import {
  createDirRequest,
  createSpdRequest,
  deleteDirRequest,
  deleteSpdRequest,
  getAllBiasRequests,
  getDirRequests,
  getSpdRequests,
} from '@odh-dashboard/trustyai/api/custom';

export type TrustyAPIState = APIState<ExplainabilityAPI>;

const useTrustyAIAPIState = (
  hostPath: string | null,
): [apiState: TrustyAPIState, refreshAPIState: () => void] => {
  const createAPI = React.useCallback(
    (path: string) => ({
      createDirRequest: createDirRequest(path),
      createSpdRequest: createSpdRequest(path),
      deleteDirRequest: deleteDirRequest(path),
      deleteSpdRequest: deleteSpdRequest(path),
      listDirRequests: getDirRequests(path),
      listRequests: getAllBiasRequests(path),
      listSpdRequests: getSpdRequests(path),
    }),
    [],
  );

  return useAPIState<ExplainabilityAPI>(hostPath, createAPI);
};

export default useTrustyAIAPIState;
