/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify params */
import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { getRoute } from '@odh-dashboard/dashboard-foundation-backend/notebookUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/:namespace/:name',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      void reply;
      const routeName = (request.params as { name: string }).name;
      const { namespace } = request.params as { namespace: string };
      return getRoute(fastify, namespace, routeName);
    }),
  );
};
