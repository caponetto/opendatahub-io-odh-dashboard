import { act } from 'react';
import { standardUseFetchStateObject, testHook } from '@odh-dashboard/jest-config/hooks';
import useConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useConnections';
import { getSecretsByLabel } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import { mockConnection } from '@odh-dashboard/test-mocks/mockConnection';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets', () => ({
  getSecretsByLabel: jest.fn(),
}));

const mockGetSecretsByLabel = jest.mocked(getSecretsByLabel);

describe('useConnections', () => {
  it('should return all connections', async () => {
    const connectionsMock = [mockConnection({ name: 'foo' }), mockConnection({ name: 'bar' })];
    mockGetSecretsByLabel.mockResolvedValue(connectionsMock);
    const renderResult = testHook(useConnections)('ds-project-1');
    expect(mockGetSecretsByLabel).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(mockGetSecretsByLabel).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchStateObject({ data: connectionsMock, loaded: true }),
    );
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable({ data: false, loaded: false, error: true, refresh: true });

    // refresh
    await act(() => renderResult.result.current.refresh());
    expect(mockGetSecretsByLabel).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToHaveUpdateCount(3);
    expect(renderResult).hookToBeStable({ data: false, loaded: true, error: true, refresh: true });
  });
});
