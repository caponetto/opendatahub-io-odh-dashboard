import { IncomingHttpHeaders } from 'http';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpProxy, { FastifyHttpProxyOptions } from '@fastify/http-proxy';
import { V1Service } from '@kubernetes/client-node';
import { K8sResourceCommon, KubeFastifyInstance, ServiceAddressAnnotation } from './backendTypes';
import { isK8sStatus, passThroughResource } from './pass-through';
import { DEV_MODE } from './constants';
import { createCustomError } from './requestUtils';
import { getAccessToken, getDirectCallOptions } from './directCallUtils';
import { EitherNotBoth } from './typeHelpers';

export const addDefaultCacheControl = (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
  if (!headers['cache-control']) {
    // eslint-disable-next-line no-param-reassign -- intentional mutation: callers expect the same object back with the default applied
    headers['cache-control'] = 'no-cache';
  }
  return headers;
};

/**
 * Narrow surface for callers (including @fastify/http-proxy) whose `FastifyRequest` generic params
 * are typed as `unknown` by Fastify depending on RawServer/request generics.
 */
type RouteParamsCarrier = {
  params?: unknown;
};

const snapshotRouteParams = (params: unknown): Record<string, unknown> => {
  if (typeof params !== 'object' || params === null) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(params)) {
    if (typeof key === 'string') {
      out[key] = Reflect.get(params, key);
    }
  }
  return out;
};

export const getParam = (req: RouteParamsCarrier, name: string): string => {
  if (typeof req.params !== 'object' || req.params === null) {
    return '';
  }
  const raw = Reflect.get(req.params, name);
  return typeof raw === 'string' ? raw : '';
};

export const setParam = (req: RouteParamsCarrier, name: string, value: string): string => {
  const nextParams = snapshotRouteParams(req.params);
  nextParams[name] = value;
  // eslint-disable-next-line no-param-reassign -- mirrored dynamic params for http-proxy preHandler consumption
  req.params = nextParams;
  return value;
};

const notFoundCauseText = (e: unknown): string => {
  if (e === undefined || e === null) {
    return '';
  }
  if (e instanceof Error) {
    return e.message;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- narrows unknown for structural HTTP errors (`typeof null === 'object'` in JS)
  if (typeof e === 'object' && e !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- axios/kube errors are structural objects excluded from Instanceof Error
    if ('code' in e && 'response' in e) {
      const codeRaw = Reflect.get(e, 'code');
      const codeStr = codeRaw !== undefined && codeRaw !== null ? String(codeRaw) : '';
      const response = Reflect.get(e, 'response');
      let msgStr = '';
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msgVal = Reflect.get(response, 'message');
        msgStr = typeof msgVal === 'string' ? msgVal : JSON.stringify(msgVal);
      }
      if (codeStr && msgStr) {
        return `${codeStr}: ${msgStr}`;
      }
      return codeStr || msgStr;
    }
  }
  if (typeof e === 'string' || typeof e === 'number' || typeof e === 'boolean') {
    return String(e);
  }
  try {
    return JSON.stringify(e);
  } catch {
    return '';
  }
};

const notFoundError = (kind: string, name: string, e?: unknown, overrideMessage?: string) => {
  const message = notFoundCauseText(e);
  return createCustomError(
    'Not Found',
    `${kind} '${name}' ${overrideMessage || 'not found'}.${message ? ` ${message}` : ''}`,
    404,
  );
};

const setAuthorizationHeader = async (request: FastifyRequest, fastify: KubeFastifyInstance) => {
  const token = getAccessToken(await getDirectCallOptions(fastify, request, ''));
  // eslint-disable-next-line no-param-reassign -- upstream proxy must receive bearer on this hop
  request.headers = { ...request.headers, authorization: `Bearer ${String(token)}` };
};

export const checkRequestLimitExceeded = (
  request: FastifyRequest,
  fastify: KubeFastifyInstance,
  reply: FastifyReply,
): boolean => {
  const limit = fastify.initialConfig.bodyLimit ?? 1024 * 1024;
  const maxLimitInMiB = (limit / 1024 / 1024).toFixed();
  const contentLength = Number(request.headers['content-length']);
  if (contentLength > limit) {
    reply.header('connection', 'close');
    reply.send(
      createCustomError(
        'Payload Too Large',
        `Request body is too large; the max limit is ${maxLimitInMiB} MiB`,
        413,
      ),
    );
    return true;
  }
  return false;
};

export const proxyService =
  <K extends K8sResourceCommon = never>(
    model: { apiGroup: string; apiVersion: string; plural: string; kind: string } | null,
    /**
     * @param service.namespace - If omitted, use namespace from request url param `:namespace`
     * @param service.name - If omitted, use name from request url param `:name`
     */
    service: EitherNotBoth<
      {
        addressAnnotation?: ServiceAddressAnnotation;
        internalPort: number | string;
        prefix?: string;
        suffix?: string;
        namespace?: string | ((fastify: KubeFastifyInstance) => string);
        name?: string;
      },
      {
        constructUrl: (resource: K) => string;
      }
    >,
    local: {
      host: string;
      port: number | string;
    },
    statusCheck?: (resource: K) => boolean,
    tls = true,
  ) =>
  async (fastify: KubeFastifyInstance): Promise<void> =>
    fastify.register(httpProxy, {
      upstream: '',
      prefix: `${!service.namespace ? '/:namespace' : ''}${!service.name ? '/:name' : ''}`,
      rewritePrefix: '',
      replyOptions: {
        // preHandler must set the `upstream` param
        getUpstream: (request) => getParam(request, 'upstream'),
      },
      preHandler: (request, reply, done) => {
        if (checkRequestLimitExceeded(request, fastify, reply)) {
          return;
        }

        // see `prefix` for named params
        const serviceNamespace =
          typeof service.namespace === 'function' ? service.namespace(fastify) : service.namespace;
        const namespace = serviceNamespace ?? getParam(request, 'namespace');
        const name = service.name ?? getParam(request, 'name');
        const serviceName = `${service.prefix ?? ''}${name}${service.suffix ?? ''}`;
        const scheme = tls ? 'https' : 'http';
        const kc = fastify.kube.config;
        const cluster = kc.getCurrentCluster();
        if (!cluster) {
          done(
            createCustomError(
              'Cluster configuration error',
              'No current kubernetes cluster configured',
              500,
            ),
          );
          return;
        }

        const getServiceAddress = async (
          svcNameForCluster: string,
          resource?: K,
        ): Promise<string | null> => {
          if (DEV_MODE) {
            // Use port forwarding for local development:
            // kubectl port-forward -n <namespace> svc/<service-name> <local.port>:<service.port>
            return `${scheme}://${local.host}:${local.port}`;
          }
          if (service.constructUrl) {
            if (resource === undefined) {
              return null;
            }
            return service.constructUrl(resource);
          }
          if (service.addressAnnotation) {
            try {
              const k8sService = await passThroughResource<V1Service>(fastify, request, {
                url: `${cluster.server}/api/v1/namespaces/${namespace}/services/${svcNameForCluster}`,
                method: 'GET',
              });
              if (isK8sStatus(k8sService)) {
                fastify.log.error(
                  `Proxy failed to read k8s service ${svcNameForCluster} in namespace ${namespace}.`,
                );
                return null;
              }
              const address = k8sService.metadata?.annotations?.[service.addressAnnotation];
              if (address) {
                return `${scheme}://${address}`;
              }
              fastify.log.error(
                `Proxy could not find address annotation on k8s service ${svcNameForCluster} in namespace ${namespace}, falling back to internal address. Annotation expected: ${service.addressAnnotation}`,
              );
            } catch (e) {
              fastify.log.error(
                e,
                `Proxy failed to read k8s service ${svcNameForCluster} in namespace ${namespace}.`,
              );
              return null;
            }
          }
          // For services configured for internal addresses (no annotation), construct the URL
          // or if annotation is expected but missing, fall back to internal address for compatibility
          return `${scheme}://${svcNameForCluster}.${namespace}.svc.cluster.local:${service.internalPort}`;
        };

        const doServiceRequest = async (resource?: K) => {
          const upstream = await getServiceAddress(serviceName, resource);
          if (!upstream) {
            done(notFoundError('Service', serviceName, undefined, 'service unavailable'));
            return;
          }
          // Assign the `upstream` param so we can dynamically set the upstream URL for http-proxy
          setParam(request, 'upstream', upstream);
          if (tls) {
            await setAuthorizationHeader(request, fastify);
          }
          fastify.log.info(`Proxy ${request.method} request ${request.url} to ${upstream}`);
          done();
        };

        // If `model` is passed, we first check if the user is able to get a resource with that model and the given namespace/name.
        // We can use this to only proxy for users that can access some resource that manages the service.
        // If `statusCheck` is also passed, we can also make sure that resource passes some check before we proxy to the service.
        if (!model) {
          void doServiceRequest();
          return;
        }
        const gatedModel = model;
        const doServiceRequestWithGatingResource = async () => {
          try {
            // Retreive the gating resource by name and namespace
            const resource = await passThroughResource<K>(fastify, request, {
              url: `${cluster.server}/apis/${gatedModel.apiGroup}/${gatedModel.apiVersion}/namespaces/${namespace}/${gatedModel.plural}/${name}`,
              method: 'GET',
            });
            if (isK8sStatus(resource)) {
              done(notFoundError(gatedModel.kind, name));
            } else if (!statusCheck || statusCheck(resource)) {
              void doServiceRequest(resource);
            } else {
              done(notFoundError(gatedModel.kind, name, undefined, 'service unavailable'));
            }
          } catch (e) {
            done(notFoundError(gatedModel.kind, name, e));
          }
        };

        void doServiceRequestWithGatingResource();
      },
    });

export const registerProxy = async (
  fastify: KubeFastifyInstance,
  {
    prefix,
    rewritePrefix,
    service,
    local,
    authorize,
    tls,
    onError,
    rewriteHeaders,
    headers,
  }: {
    prefix: string;
    rewritePrefix?: string;
    authorize?: boolean;
    tls?: boolean;
    service: {
      name: string;
      namespace: string;
      port: number | string;
    };
    local?: {
      host?: string;
      port?: number | string;
    };
    onError?: (
      reply: FastifyReply,
      error: { error: Error & { code?: string; statusCode?: number } },
    ) => void;
    rewriteHeaders?: (headers: IncomingHttpHeaders) => IncomingHttpHeaders;
    headers?: Record<string, string>;
  },
): Promise<void> => {
  const scheme = tls === false ? 'http' : 'https';
  const upstream = DEV_MODE
    ? `${scheme}://${local?.host || 'localhost'}:${local?.port ?? service.port}`
    : `${scheme}://${service.name}.${service.namespace}.svc.cluster.local:${service.port}`;
  fastify.log.info(
    `Proxy setup for: ${prefix} -> ${upstream}, rewritePrefix: ${rewritePrefix ?? ''}`,
  );
  return fastify.register(httpProxy, {
    prefix,
    rewritePrefix: rewritePrefix ?? '',
    upstream,
    replyOptions:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- @fastify/http-proxy options shape not fully aligned with upstream types
      {
        getUpstream: () => upstream,
        onError,
        rewriteHeaders,
      } as FastifyHttpProxyOptions['replyOptions'],
    preHandler: async (request, reply) => {
      if (checkRequestLimitExceeded(request, fastify, reply)) {
        return;
      }
      if (authorize) {
        await setAuthorizationHeader(request, fastify);
      }
      if (headers) {
        const merged = { ...request.headers };
        Object.entries(headers).forEach(([key, value]) => {
          merged[key.toLowerCase()] = value;
        });
        // eslint-disable-next-line no-param-reassign -- inject static proxy headers for this hop
        request.headers = merged;
      }
      fastify.log.info(`Proxy ${request.method} request ${request.url} to ${upstream}`);
    },
  });
};
