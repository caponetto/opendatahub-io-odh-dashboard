import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { act } from 'react';
import { standardUseFetchState, testHook } from '@odh-dashboard/jest-config/hooks';
import { mockClusterQueueK8sResource } from '@odh-dashboard/test-mocks/mockClusterQueueK8sResource';
import { ClusterQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useDistributedWorkloadsEnabled from '@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled';
import useClusterQueues from '@odh-dashboard/distributed-workloads/concepts/useClusterQueues';

const mockedClusterQueues = [mockClusterQueueK8sResource({ name: 'test-cluster-queue' })];

jest.mock('@odh-dashboard/k8s-browser', () => ({
  k8sListResourceItems: jest.fn(),
}));

jest.mock('@odh-dashboard/distributed-workloads/concepts/useDistributedWorkloadsEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const k8sListResourceItemsMock = jest.mocked(k8sListResourceItems<ClusterQueueKind>);
const useDistributedWorkloadsEnabledMock = jest.mocked(useDistributedWorkloadsEnabled);

describe('useClusterQueues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cluster queues', async () => {
    useDistributedWorkloadsEnabledMock.mockReturnValue(true);

    k8sListResourceItemsMock.mockResolvedValue(mockedClusterQueues);

    const renderResult = testHook(useClusterQueues)();
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState(mockedClusterQueues, true));
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable([false, false, true, true]);

    // refresh
    k8sListResourceItemsMock.mockResolvedValue([]);
    await act(() => renderResult.result.current[3]());
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToHaveUpdateCount(3);
    expect(renderResult).hookToBeStable([false, true, true, true]);
  });

  it('should handle errors and rethrow', async () => {
    k8sListResourceItemsMock.mockRejectedValue(new Error('error1'));

    const renderResult = testHook(useClusterQueues)();
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
