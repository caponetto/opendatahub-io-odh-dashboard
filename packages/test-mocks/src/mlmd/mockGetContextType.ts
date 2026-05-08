import { ContextType } from '@odh-dashboard/test-mocks/third_party/mlmd';
import { GetContextTypeResponse } from '@odh-dashboard/test-mocks/third_party/mlmd/generated/ml_metadata/proto/metadata_store_service';
import createGrpcResponse, { GrpcResponse } from './utils';

const mockedContextType: ContextType = {
  id: 11,
  name: 'system.PipelineRun',
  properties: {},
};

export const mockGetContextType = (): GrpcResponse => {
  const binary = GetContextTypeResponse.encode({ contextType: mockedContextType }).finish();
  return createGrpcResponse(binary);
};
