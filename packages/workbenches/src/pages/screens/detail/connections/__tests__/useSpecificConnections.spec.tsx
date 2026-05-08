import { waitFor } from '@testing-library/dom';
import { testHook } from '@odh-dashboard/jest-config/hooks';
import { mockConnection } from '@odh-dashboard/test-mocks/mockConnection';
import useConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useConnections';
import usePipelinesConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/usePipelinesConnections';
import useServingConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useServingConnections';

jest.mock('@odh-dashboard/connection-types-shared/concepts/connectionTypes/useConnections');
const mockUseConnections = jest.mocked(useConnections);

describe('useServingConnections', () => {
  it('should return only serving compatible connections', async () => {
    mockUseConnections.mockReturnValue({
      data: [
        mockConnection({ name: 'foo', connectionType: 'uri-v1' }),
        mockConnection({ name: 'bar', connectionType: 'random' }),
      ],
      loaded: true,
      error: undefined,
      refresh: jest.fn(),
    });
    const renderResult = testHook(useServingConnections)('ds-project-1');

    waitFor(() => {
      expect(renderResult).hookToStrictEqual({
        connections: [mockConnection({ name: 'foo', connectionType: 'uri-v1' })],
        connectionsLoadError: undefined,
        connectionsLoaded: true,
        initialNewConnectionType: undefined,
        initialNewConnectionValues: {},
      });
    });
  });
});

describe('usePipelinesConnections', () => {
  it('should return only pipelines compatible connections', async () => {
    mockUseConnections.mockReturnValue({
      data: [
        mockConnection({ name: 'foo' }),
        mockConnection({ name: 'bar', connectionType: 'random' }),
      ],
      loaded: true,
      error: undefined,
      refresh: jest.fn(),
    });
    const renderResult = testHook(usePipelinesConnections)('ds-project-1');

    waitFor(() => {
      expect(renderResult).hookToStrictEqual({
        connections: [mockConnection({ name: 'foo' })],
        connectionsLoadError: undefined,
        connectionsLoaded: true,
        initialNewConnectionType: undefined,
        initialNewConnectionValues: {},
      });
    });
  });
});
