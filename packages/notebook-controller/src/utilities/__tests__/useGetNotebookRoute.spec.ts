import { testHook } from '@odh-dashboard/jest-config/hooks';
import { mockRouteK8sResource } from '@odh-dashboard/test-mocks/mockRouteK8sResource';
import { getRoute } from '@odh-dashboard/dashboard-foundation-frontend/services/routeService';
import { listRoutes } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/routes';
import { Route } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useGetNotebookRoute } from '@odh-dashboard/workbenches-shared/concepts/notebooks/useGetNotebookRoute';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/services/routeService', () => ({
  getRoute: jest.fn(),
}));

jest.mock('@odh-dashboard/dashboard-foundation-frontend/api/k8s/routes', () => ({
  listRoutes: jest.fn(),
}));

const getRouteMock = jest.mocked(getRoute);
const listRoutesMock = jest.mocked(listRoutes);

describe('useGetNotebookRoute', () => {
  const normalizeAnnotations = (
    annotations?: Record<string, string | undefined>,
  ): Record<string, string> | undefined =>
    annotations
      ? Object.fromEntries(
          Object.entries(annotations).filter((entry): entry is [string, string] => !!entry[1]),
        )
      : undefined;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return route path for workbench when injectAuth is true', async () => {
    const renderResult = testHook(useGetNotebookRoute)('test-namespace', 'test-notebook', true);
    expect(renderResult.result.current).toBe('/notebook/test-namespace/test-notebook');

    expect(getRouteMock).not.toHaveBeenCalled();
    expect(listRoutesMock).not.toHaveBeenCalled();
  });

  it('should fetch route and return URL when isNotebookController is true', async () => {
    const mockRouteK8s = mockRouteK8sResource({
      notebookName: 'test-notebook',
      namespace: 'test-namespace',
    });

    const mockRoute: Route = {
      apiVersion: mockRouteK8s.apiVersion,
      kind: mockRouteK8s.kind,
      metadata: {
        name: mockRouteK8s.metadata?.name || '',
        namespace: mockRouteK8s.metadata?.namespace || '',
        annotations: normalizeAnnotations(mockRouteK8s.metadata?.annotations),
      },
      spec: {
        host: mockRouteK8s.spec.host,
        port: mockRouteK8s.spec.port,
        tls: {
          insecureEdgeTerminationPolicy: 'Redirect',
          termination: 'reencrypt',
        },
        to: {
          kind: 'Service',
          name: 'test-notebook-tls',
          weight: 100,
        },
        wildcardPolicy: 'None',
      },
    };

    getRouteMock.mockResolvedValue(mockRoute);

    const renderResult = testHook(useGetNotebookRoute)(
      'test-namespace',
      'test-notebook',
      false,
      true,
    );
    expect(renderResult.result.current).toBe(undefined);

    await renderResult.waitForNextUpdate();

    expect(getRouteMock).toHaveBeenCalledWith('test-namespace', 'test-notebook');
    expect(renderResult.result.current).toBe(
      'https://test-notebook-test-namespace.apps.user.com/notebook/test-namespace/test-notebook',
    );
  });

  it('should fetch route and return URL when isNotebookController is false', async () => {
    const mockRouteK8s = mockRouteK8sResource({
      notebookName: 'test-notebook',
      namespace: 'test-namespace',
    });

    listRoutesMock.mockResolvedValue([mockRouteK8s]);

    const renderResult = testHook(useGetNotebookRoute)(
      'test-namespace',
      'test-notebook',
      false,
      false,
    );
    expect(renderResult.result.current).toBe(undefined);

    await renderResult.waitForNextUpdate();

    expect(listRoutesMock).toHaveBeenCalledWith('test-namespace', 'notebook-name=test-notebook');
    expect(renderResult.result.current).toBe(
      'https://test-notebook-test-namespace.apps.user.com/notebook/test-namespace/test-notebook',
    );
  });

  it('should use listRoutes as default when injectAuth and isNotebookController are both false', async () => {
    const mockRouteK8s = mockRouteK8sResource({
      notebookName: 'test-notebook',
      namespace: 'test-namespace',
    });

    listRoutesMock.mockResolvedValue([mockRouteK8s]);

    const renderResult = testHook(useGetNotebookRoute)('test-namespace', 'test-notebook');
    expect(renderResult.result.current).toBe(undefined);

    await renderResult.waitForNextUpdate();

    expect(listRoutesMock).toHaveBeenCalledWith('test-namespace', 'notebook-name=test-notebook');
    expect(renderResult.result.current).toBe(
      'https://test-notebook-test-namespace.apps.user.com/notebook/test-namespace/test-notebook',
    );
  });

  it('should handle missing namespace and name gracefully', async () => {
    const renderResult = testHook(useGetNotebookRoute)('', '', true);
    expect(renderResult.result.current).toBe(undefined);

    expect(getRouteMock).not.toHaveBeenCalled();
    expect(listRoutesMock).not.toHaveBeenCalled();
  });

  it('should update when parameters change', async () => {
    const renderResult = testHook(useGetNotebookRoute)('test-namespace', 'notebook-1', true);
    expect(renderResult.result.current).toBe('/notebook/test-namespace/notebook-1');

    renderResult.rerender('test-namespace', 'notebook-2', true);
    expect(renderResult.result.current).toBe('/notebook/test-namespace/notebook-2');
    expect(getRouteMock).not.toHaveBeenCalled();
    expect(listRoutesMock).not.toHaveBeenCalled();
  });
});
