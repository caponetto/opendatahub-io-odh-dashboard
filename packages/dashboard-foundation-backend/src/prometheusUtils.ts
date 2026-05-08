import { KubeFastifyInstance, OauthFastifyRequest, QueryType } from './backendTypes';
import { DEV_MODE, THANOS_INSTANCE_NAME, THANOS_NAMESPACE, THANOS_RBAC_PORT } from './constants';
import { createCustomError } from './requestUtils';
import { proxyCall, ProxyError, ProxyErrorType } from './httpUtils';

const readUnknownThrownMessage = (e: unknown): string => {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const msg = Reflect.get(e, 'message');
    return typeof msg === 'string' ? msg : 'Unknown reason.';
  }
  return 'Unknown reason.';
};

const callPrometheus = async <T>(
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  query: string,
  host: string,
  queryType: QueryType,
  rejectOnHttpErrorCode = false,
): Promise<{ code: number; response: T }> => {
  if (!query) {
    fastify.log.warn('Prometheus call was made without a query');
    return Promise.reject({ code: 400, response: 'Failed to provide a query' });
  }

  if (!host) {
    fastify.log.warn('Prometheus call was made with a host that does not exist');
    return Promise.reject({ code: 400, response: 'Failed to find the prometheus instance host' });
  }

  const url = `${host}/api/v1/${queryType}?${query}`;

  fastify.log.info(`Prometheus query: ${query}`);
  return proxyCall(fastify, request, {
    method: 'GET',
    url,
  })
    .then(([rawData, status]) => {
      const code = status.code ?? 500;
      if (rejectOnHttpErrorCode && code >= 400) {
        throw createCustomError(status.message ?? 'HTTP error', rawData, code);
      }
      try {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Prometheus query API returns unstructured JSON
        const parsedData = JSON.parse(rawData) as { status?: string; error?: string };
        if (parsedData.status === 'error') {
          throw { code: 400, response: parsedData.error ?? 'prometheus error' };
        }
        fastify.log.info('Successful response from Prometheus.');
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- response shape is caller-controlled via generic
        return { code: 200, response: parsedData as T };
      } catch (e: unknown) {
        const errorMessage = readUnknownThrownMessage(e);
        fastify.log.error(`Failure parsing the response from Prometheus. ${errorMessage}`);
        if (errorMessage.includes('Unexpected token < in JSON')) {
          throw { code: 422, response: 'Unprocessable prometheus response' };
        }
        fastify.log.error(`Unparsed Prometheus data. ${rawData}`);
        throw { code: 500, response: rawData };
      }
    })
    .catch((error) => {
      let errorMessage = 'Unknown error';
      if (error instanceof ProxyError) {
        errorMessage = error.message || errorMessage;
        switch (error.proxyErrorType) {
          case ProxyErrorType.HTTP_FAILURE:
            fastify.log.error(`Failure calling Prometheus. ${errorMessage}`);
            throw { code: 500, response: `Cannot fetch prometheus data, ${errorMessage}` };
          default:
          // unhandled type, fall-through
        }
      } else if (!(error instanceof Error)) {
        errorMessage = JSON.stringify(error);
      }

      fastify.log.error(`Unhandled error during prometheus call: ${errorMessage}`);
      throw error;
    });
};

const generatePrometheusHostURL = (
  fastify: KubeFastifyInstance,
  instanceName: string,
  namespace: string,
  port: string,
): string => {
  if (DEV_MODE) {
    const apiPath = fastify.kube.config.getCurrentCluster()?.server ?? '';
    const namedHost =
      process.env.CONSOLE_LINK_DOMAIN || apiPath.slice('https://api.'.length).split(':')[0];
    return `https://${instanceName}-${namespace}.apps.${namedHost}`;
  }
  return `https://${instanceName}.${namespace}.svc.cluster.local:${port}`;
};

export const callPrometheusThanos = <T>(
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  query: string,
  queryType: QueryType = QueryType.QUERY,
): Promise<{ code: number; response: T }> =>
  callPrometheus<T>(
    fastify,
    request,
    query,
    generatePrometheusHostURL(fastify, THANOS_INSTANCE_NAME, THANOS_NAMESPACE, THANOS_RBAC_PORT),
    queryType,
    true,
  );
