import { act } from 'react';
import { standardUseFetchStateObject, testHook } from '@odh-dashboard/jest-config/hooks';
import { mockPrometheusQueryResponse } from '@odh-dashboard/test-mocks/mockPrometheusQueryResponse';
import axios from '@odh-dashboard/dashboard-foundation-frontend/utilities/axios';
import usePrometheusQuery from '../usePrometheusQuery';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/axios', () => ({
  post: jest.fn(),
}));

const mockAxios = jest.mocked(axios.post);

describe('usePrometheusQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const apiPath = '/api/prometheus/pvc';
  const query = `namespace=test-project`;

  it('should return and fetch prometheus query', async () => {
    const prometheusResponse = { data: { response: mockPrometheusQueryResponse({}) } };
    mockAxios.mockResolvedValue(prometheusResponse);
    const renderResult = await testHook(usePrometheusQuery)(apiPath, query);
    expect(renderResult).hookToStrictEqual(standardUseFetchStateObject({ data: null }));
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(mockAxios).toHaveBeenCalledWith('/api/prometheus/pvc', {
      query: 'namespace=test-project',
    });
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchStateObject({ data: prometheusResponse.data.response, loaded: true }),
    );
    expect(renderResult).hookToHaveUpdateCount(2);

    // refresh
    mockAxios.mockResolvedValue(prometheusResponse);
    await act(() => renderResult.result.current.refresh());
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToHaveUpdateCount(3);
  });

  it('should handle when query is empty string', async () => {
    await testHook(usePrometheusQuery)(apiPath, '');
    expect(mockAxios).toHaveBeenCalledTimes(0);
  });

  it('should handle errors and rethrow', async () => {
    mockAxios.mockRejectedValue(new Error('error1'));

    const renderResult = testHook(usePrometheusQuery)(apiPath, query);
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchStateObject({ data: null }));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchStateObject({ data: null, error: new Error('error1') }),
    );
    expect(renderResult).hookToHaveUpdateCount(2);

    mockAxios.mockRejectedValue(new Error('error2'));
    await act(() => renderResult.result.current.refresh());
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchStateObject({ data: null, error: new Error('error2') }),
    );
    expect(renderResult).hookToHaveUpdateCount(3);
  });
});
