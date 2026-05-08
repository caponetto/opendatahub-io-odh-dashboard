import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { listConsoleLinks } from './list';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      listConsoleLinks()
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
