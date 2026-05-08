import { k8sGetResource, k8sListResource } from '@odh-dashboard/k8s-browser';
import { mockRouteK8sResource } from '@odh-dashboard/test-mocks/mockRouteK8sResource';
import { mockK8sResourceList } from '@odh-dashboard/test-mocks/mockK8sResourceList';
import { getRoute, listRoutes } from '../routes';
import { RouteModel } from '../../models';
import { RouteKind } from '../../../k8sTypes';

jest.mock('@odh-dashboard/k8s-browser', () => ({
  k8sGetResource: jest.fn(),
  k8sListResource: jest.fn(),
}));

const k8sGetResourceMock = jest.mocked(k8sGetResource<RouteKind>);
const k8sListResourceMock = jest.mocked(k8sListResource<RouteKind>);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getRoute', () => {
  const name = 'test';
  const namespace = 'test-project';

  it('should return route when k8s api option is not given', async () => {
    const routeMock = mockRouteK8sResource({});
    k8sGetResourceMock.mockResolvedValue(routeMock);
    const result = await getRoute(name, namespace);
    expect(result).toStrictEqual(routeMock);
    expect(k8sGetResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sGetResourceMock).toHaveBeenCalledWith({
      fetchOptions: {
        requestInit: {},
      },
      model: RouteModel,
      queryOptions: { name, ns: namespace, queryParams: {} },
    });
  });

  it('should return route when k8s api option is given', async () => {
    const routeMock = mockRouteK8sResource({});
    k8sGetResourceMock.mockResolvedValue(routeMock);
    const result = await getRoute(name, namespace, { dryRun: true });
    expect(result).toStrictEqual(routeMock);
    expect(k8sGetResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sGetResourceMock).toHaveBeenCalledWith({
      fetchOptions: {
        requestInit: {},
      },
      payload: {
        dryRun: ['All'],
      },
      model: RouteModel,
      queryOptions: { name, ns: namespace, queryParams: { dryRun: 'All' } },
    });
  });

  it('should handle errors and rethrows', async () => {
    k8sGetResourceMock.mockRejectedValue(new Error('error'));
    await expect(getRoute(name, namespace)).rejects.toThrow('error');
    expect(k8sGetResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sGetResourceMock).toHaveBeenCalledWith({
      fetchOptions: {
        requestInit: {},
      },
      model: RouteModel,
      queryOptions: { name, ns: namespace, queryParams: {} },
    });
  });
});

describe('listRoutes', () => {
  const namespace = 'test-project';

  it('should list routes when label selector is not given', async () => {
    const routeMock = mockRouteK8sResource({});
    k8sListResourceMock.mockResolvedValue(mockK8sResourceList([routeMock]));

    const result = await listRoutes(namespace);

    expect(result).toStrictEqual([routeMock]);
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sListResourceMock).toHaveBeenCalledWith({
      fetchOptions: { requestInit: {} },
      model: RouteModel,
      queryOptions: { ns: namespace, queryParams: {} },
    });
  });

  it('should list routes when label selector is given', async () => {
    const routeMock = mockRouteK8sResource({});
    k8sListResourceMock.mockResolvedValue(mockK8sResourceList([routeMock]));

    const result = await listRoutes(namespace, 'labelSelector');

    expect(result).toStrictEqual([routeMock]);
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sListResourceMock).toHaveBeenCalledWith({
      fetchOptions: { requestInit: {} },
      model: RouteModel,
      queryOptions: { ns: namespace, queryParams: { labelSelector: 'labelSelector' } },
    });
  });

  it('should list routes when k8s api option is given', async () => {
    const routeMock = mockRouteK8sResource({});
    k8sListResourceMock.mockResolvedValue(mockK8sResourceList([routeMock]));

    const result = await listRoutes(namespace, 'labelSelector', { dryRun: true });

    expect(result).toStrictEqual([routeMock]);
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sListResourceMock).toHaveBeenCalledWith({
      fetchOptions: { requestInit: {} },
      payload: { dryRun: ['All'] },
      model: RouteModel,
      queryOptions: {
        ns: namespace,
        queryParams: {
          labelSelector: 'labelSelector',
          dryRun: 'All',
        },
      },
    });
  });

  it('should handle errors and rethrow', async () => {
    k8sListResourceMock.mockRejectedValue(new Error('error1'));

    await expect(listRoutes(namespace, 'labelSelector')).rejects.toThrow('error1');
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sListResourceMock).toHaveBeenCalledWith({
      fetchOptions: { requestInit: {} },
      model: RouteModel,
      queryOptions: { ns: namespace, queryParams: { labelSelector: 'labelSelector' } },
    });
  });
});
