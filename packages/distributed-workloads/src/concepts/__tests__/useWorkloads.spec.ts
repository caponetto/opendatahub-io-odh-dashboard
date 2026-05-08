import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { act } from 'react';
import { standardUseFetchState, testHook } from '@odh-dashboard/jest-config/hooks';
import { mockWorkloadK8sResource } from '@odh-dashboard/test-mocks/mockWorkloadK8sResource';
import { WorkloadKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useDistributedWorkloadsEnabled from '@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled';
import useWorkloads from '@odh-dashboard/distributed-workloads/concepts/useWorkloads';

const mockedWorkloads = [
  mockWorkloadK8sResource({
    k8sName: 'test-workload',
    namespace: 'test-project',
  }),
];

jest.mock('@odh-dashboard/k8s-browser', () => ({
  k8sListResourceItems: jest.fn(),
}));

jest.mock('@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const k8sListResourceItemsMock = jest.mocked(k8sListResourceItems<WorkloadKind>);
const useDistributedWorkloadsEnabledMock = jest.mocked(useDistributedWorkloadsEnabled);

describe('useWorkloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return workloads for a namespace', async () => {
    useDistributedWorkloadsEnabledMock.mockReturnValue(true);

    k8sListResourceItemsMock.mockResolvedValue(mockedWorkloads);

    const renderResult = testHook(useWorkloads)('test-project');
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState(mockedWorkloads, true));
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable([false, false, true, true]);

    // refresh
    k8sListResourceItemsMock.mockResolvedValue([]);
    await act(() => renderResult.result.current[3]());
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToHaveUpdateCount(3);
    expect(renderResult).hookToBeStable([false, true, true, true]);
  });

  it('should handle no namespace error', async () => {
    const renderResult = testHook(useWorkloads)();
    expect(k8sListResourceItemsMock).not.toHaveBeenCalled();
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);
  });

  it('should handle errors and rethrow', async () => {
    k8sListResourceItemsMock.mockRejectedValue(new Error('error1'));

    const renderResult = testHook(useWorkloads)('test-project');
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([], false, new Error('error1')));
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable([true, true, false, true]);

    // refresh
    k8sListResourceItemsMock.mockRejectedValue(new Error('error2'));
    await act(() => renderResult.result.current[3]());
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([], false, new Error('error2')));
    expect(renderResult).hookToHaveUpdateCount(3);
    expect(renderResult).hookToBeStable([true, true, false, true]);
  });
});
