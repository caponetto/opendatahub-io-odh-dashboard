import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import {
  getDashboardConfig,
  updateDashboardConfig,
} from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';
import {
  secureAdminRoute,
  secureRoute,
} from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { setDashboardConfig } from './configUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const forceRefresh = request.headers['cache-control'] === 'no-cache';

      if (forceRefresh) {
        await updateDashboardConfig();
      }

      reply.header('Cache-Control', 'no-cache').send(getDashboardConfig(request));
    }),
  );

  fastify.patch(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      if ('body' in request && request.body && typeof request.body === 'object') {
        reply.send(setDashboardConfig(fastify, request.body));
      }
    }),
  );
};
