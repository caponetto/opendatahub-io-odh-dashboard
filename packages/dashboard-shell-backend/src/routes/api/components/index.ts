import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import {
  secureRoute,
  secureAdminRoute,
} from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { listComponents, removeComponent } from './list';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      listComponents(fastify, request)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );

  fastify.get(
    '/remove',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      removeComponent(fastify, request)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
