/* eslint-disable @typescript-eslint/consistent-type-assertions -- K8s error shapes */
import { FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';
import { getConfigMap, getSecret } from '@odh-dashboard/dashboard-foundation-backend/envUtils';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

/** `e.statusCode` is carried on some kubernetes client failures */
const getStatusCode = (e: unknown): number | undefined =>
  typeof e === 'object' && e !== null && 'statusCode' in e
    ? Number((e as { statusCode: unknown }).statusCode)
    : undefined;

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/secret/:namespace/:name',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };

      return getSecret(fastify, namespace, name).catch((e: unknown) => {
        const statusCode = getStatusCode(e);
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (
                e as {
                  response?: { body?: { message?: unknown } };
                  message?: string;
                }
              ).response?.body?.message
            : undefined;
        const messageBody =
          (typeof msg === 'string' && msg) ||
          errorHandler(e) ||
          (e instanceof Error ? e.message : String(e));
        if (statusCode !== 404) {
          fastify.log.error(`Failed get env secret, ${messageBody}`);
        }
        reply.status(404).send(messageBody);
      });
    }),
  );

  fastify.get(
    '/configmap/:namespace/:name',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };

      return getConfigMap(fastify, namespace, name).catch((e: unknown) => {
        const statusCode = getStatusCode(e);
        const msg =
          typeof e === 'object' && e !== null && 'response' in e
            ? (
                e as {
                  response?: { body?: { message?: unknown } };
                  message?: string;
                }
              ).response?.body?.message
            : undefined;
        const messageBody =
          (typeof msg === 'string' && msg) ||
          errorHandler(e) ||
          (e instanceof Error ? e.message : String(e));
        if (statusCode !== 404) {
          fastify.log.error(`Failed get env configmap, ${messageBody}`);
        }
        reply.status(404).send(messageBody);
      });
    }),
  );
};
