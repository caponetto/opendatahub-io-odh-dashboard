import { KubeFastifyInstance, RouteKind } from './backendTypes';

type RoutesBody = {
  items?: RouteKind[];
};

export const getRouteForClusterId = (fastify: KubeFastifyInstance, route: string): string =>
  route ? route.replace('<CLUSTER_ID/>', fastify.kube.clusterID) : route;

const getURLForRoute = (route: RouteKind, routeSuffix: string): string | null => {
  const { host } = route.spec;
  if (!host) {
    return null;
  }
  const tlsTerm = route.spec.tls?.termination;
  const protocol = tlsTerm ? 'https' : 'http';
  const suffix = routeSuffix ? `/${routeSuffix}` : '';
  return `${protocol}://${host}${suffix}`;
};

export const getLink = async (
  fastify: KubeFastifyInstance,
  routeName: string,
  namespace?: string,
  routeSuffix?: string,
): Promise<string | null> => {
  const { customObjectsApi } = fastify.kube;
  const routeNamespace = namespace || fastify.kube.namespace;
  if (!routeName) {
    return null;
  }
  try {
    const routeResp = await customObjectsApi.getNamespacedCustomObject(
      'route.openshift.io',
      'v1',
      routeNamespace,
      'routes',
      routeName,
    );
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- OpenShift Route from custom objects API body
    const route = routeResp.body as RouteKind;
    return getURLForRoute(route, routeSuffix ?? '');
  } catch (e) {
    fastify.log.info(`failed to get route ${routeName} in namespace ${routeNamespace}`);
    return null;
  }
};

export const getServiceLink = async (
  fastify: KubeFastifyInstance,
  serviceName: string,
  routeSuffix: string,
): Promise<string | null> => {
  if (!serviceName) {
    return null;
  }
  const svcListResp = await fastify.kube.coreV1Api.listServiceForAllNamespaces(
    undefined,
    undefined,
    `metadata.name=${serviceName}`,
  );
  const firstService = svcListResp.body.items[0];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- typings guarantee an array slot; runtime filter may yield no matching service
  if (firstService == null) {
    return null;
  }

  const { customObjectsApi } = fastify.kube;
  const namespace = firstService.metadata?.namespace;
  if (!namespace) {
    return null;
  }
  try {
    const routesListResp = await customObjectsApi.listNamespacedCustomObject(
      'route.openshift.io',
      'v1',
      namespace,
      'routes',
    );
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- OpenShift Routes list wrapper from custom objects API
    const routeItems = (routesListResp.body as RoutesBody).items ?? [];
    if (routeItems.length === 0) {
      return null;
    }
    return getURLForRoute(routeItems[0], routeSuffix);
  } catch (e) {
    fastify.log.info(`failed to get route in namespace ${namespace}`);
    return null;
  }
};

export const convertLabelsToString = (labels: { [key: string]: string }): string => {
  let outputString = '';
  for (const key in labels) {
    outputString = outputString.concat(key, '=', labels[key], ' ');
  }
  return outputString;
};
