import { IncomingMessage } from 'http';
import { KubeFastifyInstance, PlatformType, RouteKind } from '../types';

type RoutesResponse = {
  body: {
    items: RouteKind[];
  };
  response: IncomingMessage;
};

type IngressRule = {
  host?: string;
  http?: {
    paths?: Array<{
      path?: string;
      backend?: {
        service?: { name?: string; port?: { number?: number } };
      };
    }>;
  };
};

type IngressKind = {
  spec?: {
    tls?: Array<{ hosts?: string[] }>;
    rules?: IngressRule[];
  };
};

export const getRouteForClusterId = (fastify: KubeFastifyInstance, route: string): string =>
  route ? route.replace('<CLUSTER_ID/>', fastify.kube.clusterID) : route;

const getURLForRoute = (route: RouteKind, routeSuffix: string): string => {
  const host = route?.spec?.host;
  if (!host) {
    return null;
  }
  const tlsTerm = route.spec.tls?.termination;
  const protocol = tlsTerm ? 'https' : 'http';
  const suffix = routeSuffix ? `/${routeSuffix}` : '';
  return `${protocol}://${host}${suffix}`;
};

const getURLForIngress = (ingress: IngressKind, routeSuffix: string): string => {
  const host = ingress?.spec?.rules?.[0]?.host;
  if (!host) {
    return null;
  }
  const hasTLS = ingress.spec?.tls?.some((tls) => tls.hosts?.includes(host));
  const protocol = hasTLS ? 'https' : 'http';
  const suffix = routeSuffix ? `/${routeSuffix}` : '';
  return `${protocol}://${host}${suffix}`;
};

const getLinkViaRoute = async (
  fastify: KubeFastifyInstance,
  routeName: string,
  namespace: string,
  routeSuffix?: string,
): Promise<string> => {
  try {
    const route = await fastify.kube.customObjectsApi
      .getNamespacedCustomObject('route.openshift.io', 'v1', namespace, 'routes', routeName)
      .then((res) => res.body as RouteKind);
    return getURLForRoute(route, routeSuffix);
  } catch {
    return null;
  }
};

const getLinkViaIngress = async (
  fastify: KubeFastifyInstance,
  ingressName: string,
  namespace: string,
  routeSuffix?: string,
): Promise<string> => {
  try {
    const ingress = await fastify.kube.customObjectsApi
      .getNamespacedCustomObject('networking.k8s.io', 'v1', namespace, 'ingresses', ingressName)
      .then((res) => res.body as IngressKind);
    return getURLForIngress(ingress, routeSuffix);
  } catch {
    return null;
  }
};

export const getLink = async (
  fastify: KubeFastifyInstance,
  routeName: string,
  namespace?: string,
  routeSuffix?: string,
): Promise<string> => {
  const routeNamespace = namespace || fastify.kube.namespace;
  if (!routeName) {
    return null;
  }

  if (fastify.kube.platform === PlatformType.OpenShift) {
    const url = await getLinkViaRoute(fastify, routeName, routeNamespace, routeSuffix);
    if (url) {
      return url;
    }
  }

  return getLinkViaIngress(fastify, routeName, routeNamespace, routeSuffix);
};

export const getServiceLink = async (
  fastify: KubeFastifyInstance,
  serviceName: string,
  routeSuffix: string,
): Promise<string> => {
  if (!serviceName) {
    return null;
  }
  const res = await fastify.kube.coreV1Api.listServiceForAllNamespaces(
    undefined,
    undefined,
    `metadata.name=${serviceName}`,
  );
  const service = res?.body.items?.[0];
  if (!service) {
    return null;
  }

  const { namespace } = service.metadata;

  if (fastify.kube.platform === PlatformType.OpenShift) {
    try {
      const routes = await fastify.kube.customObjectsApi
        .listNamespacedCustomObject('route.openshift.io', 'v1', namespace, 'routes')
        .then((res: RoutesResponse) => res?.body?.items);
      const url = getURLForRoute(routes?.[0], routeSuffix);
      if (url) {
        return url;
      }
    } catch {
      fastify.log.info(`failed to get route in namespace ${namespace}`);
    }
  }

  try {
    const ingresses = await fastify.kube.customObjectsApi
      .listNamespacedCustomObject('networking.k8s.io', 'v1', namespace, 'ingresses')
      .then((res) => (res.body as { items: IngressKind[] }).items);
    if (ingresses?.length) {
      return getURLForIngress(ingresses[0], routeSuffix);
    }
  } catch {
    fastify.log.info(`failed to get ingress in namespace ${namespace}`);
  }

  return null;
};

export const convertLabelsToString = (labels: { [key: string]: string }): string => {
  let outputString = '';
  for (const key in labels) {
    outputString = outputString.concat(key, '=', labels[key], ' ');
  }
  return outputString;
};
