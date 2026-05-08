/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify params/body */
import { FastifyReply, FastifyRequest } from 'fastify';
import { PatchUtils } from '@kubernetes/client-node';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';
import {
  KubeFastifyInstance,
  DashboardConfig,
  RecursivePartial,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/:namespace/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };
      try {
        const response = await fastify.kube.customObjectsApi.getNamespacedCustomObject(
          'opendatahub.io',
          'v1alpha',
          namespace,
          'odhdashboardconfigs',
          name,
        );
        return response.body;
      } catch (e: unknown) {
        fastify.log.error(`Dashboard ${name} could not be read, ${errorHandler(e)}`);
        return reply.send(e);
      }
    }),
  );

  fastify.patch(
    '/:namespace/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const options = {
        headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_PATCH },
      };
      const { namespace, name } = request.params as { namespace: string; name: string };
      const body = request.body as RecursivePartial<DashboardConfig>;
      try {
        const response = await fastify.kube.customObjectsApi.patchNamespacedCustomObject(
          'opendatahub.io',
          'v1alpha',
          namespace,
          'odhdashboardconfigs',
          name,
          body,
          undefined,
          undefined,
          undefined,
          options,
        );
        return response.body;
      } catch (e: unknown) {
        fastify.log.error(`Dashboard ${name} could not be patched, ${errorHandler(e)}`);
        return reply.send(e);
      }
    }),
  );
};
