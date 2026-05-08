import { FastifyReply, FastifyRequest } from 'fastify';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { getValidateISVResults, validateISV } from './validateISV';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return validateISV(fastify, request)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          fastify.log.error(`Failed to create validation job: ${res.response?.body?.message}`);
          reply.send(res);
        });
    }),
  );

  fastify.get(
    '/results',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return getValidateISVResults(fastify, request)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          fastify.log.error(`Failed to get validation job results: ${res.response?.body?.message}`);
          reply.send(res);
        });
    }),
  );
};
