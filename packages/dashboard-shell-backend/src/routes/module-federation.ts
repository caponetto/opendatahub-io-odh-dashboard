/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify proxies / MF error shapes */
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getModuleFederationConfigs,
  type ModuleFederationConfig,
} from '@odh-dashboard/dashboard-config';
import {
  addDefaultCacheControl,
  registerProxy,
} from '@odh-dashboard/dashboard-foundation-backend/proxy';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { DEV_MODE } from '@odh-dashboard/dashboard-foundation-backend/constants';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';

export default async (
  fastify: KubeFastifyInstance,
  opts: { assemblerDir?: string },
): Promise<void> => {
  let mfConfig: ModuleFederationConfig[] = [];
  try {
    mfConfig = getModuleFederationConfigs(DEV_MODE, opts.assemblerDir);
  } catch (e: unknown) {
    fastify.log.error(errorHandler(e));
  }
  if (mfConfig.length > 0) {
    fastify.log.info(
      `Module federation configured for: ${mfConfig.map((mf) => mf.name).join(', ')}`,
    );
    mfConfig.forEach(({ name, backend, proxyService }) => {
      if (backend) {
        registerProxy(fastify, {
          prefix: `/_mf/${name}`,
          rewritePrefix: ``,
          authorize: backend.authorize,
          tls: backend.tls,
          service: {
            ...backend.service,
            namespace: backend.service.namespace,
          },
          local: backend.localService,
          headers: backend.headers,
          rewriteHeaders: addDefaultCacheControl,
          onError: (reply: FastifyReply, proxyError: { error: unknown }) => {
            const nested = proxyError.error as { code?: string; statusCode?: number } | undefined;
            if (
              nested?.code === 'FST_REPLY_FROM_INTERNAL_SERVER_ERROR' &&
              nested.statusCode === 500
            ) {
              fastify.log.error(`Module federation service '${name}' is unavailable`);
              // Respond with 503 Service Unavailable instead of 500
              reply.code(503).send({
                error: 'Service Unavailable',
                message: `Module federation service '${name}' is currently unavailable`,
                statusCode: 503,
              });
            } else {
              reply.send(proxyError);
            }
          },
        });
      }

      proxyService?.forEach((proxy) => {
        registerProxy(fastify, {
          prefix: proxy.path,
          rewritePrefix: proxy.pathRewrite,
          authorize: proxy.authorize,
          tls: proxy.tls,
          service: {
            ...proxy.service,
            namespace: proxy.service.namespace,
          },
          local: proxy.localService,
          headers: proxy.headers,
        });
      });
    });
  } else {
    fastify.log.info(`Module federation is not configured`);
  }

  // Fallback to 404 for all module federation requests.
  fastify.get('/_mf/*', async (_: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send();
    return reply;
  });
};
