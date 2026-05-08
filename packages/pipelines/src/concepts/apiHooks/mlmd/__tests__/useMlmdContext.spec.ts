import { standardUseFetchState, testHook } from '@odh-dashboard/jest-config/hooks';
import { MlmdContextTypes } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { useMlmdContext } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useMlmdContext';
import { MetadataStoreServicePromiseClient, Context } from '../../../../third_party/mlmd';
import { GetContextByTypeAndNameResponse } from '../../../../third_party/mlmd/generated/ml_metadata/proto/metadata_store_service_pb';

// Mock the usePipelinesAPI hook
jest.mock('@odh-dashboard/pipelines/concepts/context', () => ({
  usePipelinesAPI: jest.fn(),
}));

// Mock the getMlmdContext function
jest.mock('@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useMlmdContext', () => ({
  ...jest.requireActual('@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useMlmdContext'),
  getMlmdContext: jest.fn(),
}));

// Mock the MetadataStoreServicePromiseClient
jest.mock('@odh-dashboard/pipelines/third_party/mlmd', () => {
  const originalModule = jest.requireActual('@odh-dashboard/pipelines/third_party/mlmd');
  return {
    ...originalModule,
    MetadataStoreServicePromiseClient: jest.fn().mockImplementation(() => ({
      getContextByTypeAndName: jest.fn(),
    })),
    GetContextByTypeAndNameRequest: originalModule.GetContextByTypeAndNameRequest,
  };
});

describe('useMlmdContext', () => {
  const mockClient = new MetadataStoreServicePromiseClient('');
  const mockUsePipelinesAPI = jest.mocked(
    usePipelinesAPI as () => Partial<ReturnType<typeof usePipelinesAPI>>,
  );
  const mockGetContextByTypeAndName = jest.mocked(mockClient.getContextByTypeAndName);

  const mockContext = new Context();
  mockContext.setName('test-context');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePipelinesAPI.mockReturnValue({
      metadataStoreServiceClient: mockClient,
    });
  });

  it('should return an error when no type is provided', async () => {
    const renderResult = testHook(useMlmdContext)('someName');

    expect(renderResult.result.current).toStrictEqual(
      standardUseFetchState(null, false, undefined),
    );
  });

  it('should return an error when no name is provided', async () => {
    const renderResult = testHook(useMlmdContext)(undefined, MlmdContextTypes.RUN);

    expect(renderResult.result.current).toStrictEqual(
      standardUseFetchState(null, false, undefined),
    );
  });

  it('should fetch and return the context', async () => {
    mockGetContextByTypeAndName.mockResolvedValue({
      getContext: () => mockContext,
    } as GetContextByTypeAndNameResponse);

    const renderResult = testHook(useMlmdContext)('testName', MlmdContextTypes.RUN);

    expect(renderResult.result.current).toStrictEqual(standardUseFetchState(null));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();

    expect(renderResult.result.current).toStrictEqual(standardUseFetchState(mockContext, true));
    expect(renderResult).hookToHaveUpdateCount(2);
  });

  it('should handle no result from getMlmdContext', async () => {
    mockGetContextByTypeAndName.mockResolvedValue({
      getContext: () => undefined,
    } as GetContextByTypeAndNameResponse);

    const renderResult = testHook(useMlmdContext)('testName', MlmdContextTypes.RUN);

    expect(renderResult.result.current).toStrictEqual(standardUseFetchState(null));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();

    expect(renderResult.result.current).toStrictEqual(
      standardUseFetchState(null, false, new Error('Cannot find specified context')),
    );
    expect(renderResult).hookToHaveUpdateCount(2);
  });

  it('should handle errors from getMlmdContext', async () => {
    const error = new Error('Test error');
    mockGetContextByTypeAndName.mockRejectedValue(error);

    const renderResult = testHook(useMlmdContext)('testName', MlmdContextTypes.RUN);

    expect(renderResult.result.current).toStrictEqual(standardUseFetchState(null));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();

    expect(renderResult.result.current).toStrictEqual(standardUseFetchState(null, false, error));
    expect(renderResult).hookToHaveUpdateCount(2);
  });
});
