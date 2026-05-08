/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify request generics */
import { FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { status } from './statusUtils';
import { getAllowedUsers } from './adminAllowedUsers';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return status(fastify, request)
      .then((res) => {
        return res;
      })
      .catch((e: unknown) => {
        fastify.log.error(`Failed to get status, ${errorHandler(e)}`);
        reply.send(errorHandler(e) || (e instanceof Error ? e.message : String(e)));
      });
  });

  fastify.get(
    '/:namespace/allowedUsers',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return getAllowedUsers(
        fastify,
        request as FastifyRequest<{ Params: { namespace: string } }>,
      ).catch((e: unknown) => {
        reply.status(500).send({ message: e instanceof Error ? e.message : String(e) });
      });
    }),
  );
};
