import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { act } from 'react';
import { standardUseFetchState, testHook } from '@odh-dashboard/jest-config/hooks';
import { mockLocalQueueK8sResource } from '@odh-dashboard/test-mocks/mockLocalQueueK8sResource';
import { LocalQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useIsAreaAvailable } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import useLocalQueues from '@odh-dashboard/distributed-workloads-shared/concepts/distributedWorkloads/useLocalQueues';

const mockedLocalQueues = [
  mockLocalQueueK8sResource({
    name: 'test-local-queue',
    namespace: 'test-project',
  }),
];

jest.mock('@odh-dashboard/k8s-browser', () => ({
  k8sListResourceItems: jest.fn(),
}));

jest.mock('@odh-dashboard/dashboard-foundation-frontend/concepts/areas', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/concepts/areas'),
  useIsAreaAvailable: jest.fn(),
}));

const k8sListResourceItemsMock = jest.mocked(k8sListResourceItems<LocalQueueKind>);
const useIsAreaAvailableMock = jest.mocked(useIsAreaAvailable);

describe('useLocalQueues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsAreaAvailableMock.mockReturnValue({
      status: true,
      devFlags: null,
      featureFlags: null,
      reliantAreas: null,
      requiredComponents: null,
      requiredCapabilities: null,
      customCondition: () => false,
    } as ReturnType<typeof useIsAreaAvailable>);
  });

  it('should return localqueues for a namespace', async () => {
    k8sListResourceItemsMock.mockResolvedValue(mockedLocalQueues);

    const renderResult = testHook(useLocalQueues)('test-project');
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState(mockedLocalQueues, true));
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
    const renderResult = testHook(useLocalQueues)();
    expect(k8sListResourceItemsMock).not.toHaveBeenCalled();
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);
  });

  it('should handle errors and rethrow', async () => {
    k8sListResourceItemsMock.mockRejectedValue(new Error('error1'));

    const renderResult = testHook(useLocalQueues)('test-project');
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
