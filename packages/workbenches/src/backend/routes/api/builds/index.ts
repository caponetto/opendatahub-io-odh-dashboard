import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { listBuilds } from './list';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      listBuilds()
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
