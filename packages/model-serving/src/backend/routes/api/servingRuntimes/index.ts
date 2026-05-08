/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/restrict-template-expressions */
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  KubeFastifyInstance,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';

type RouteError = { response?: { body?: { message?: string } }; message?: string };

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.post(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { dryRun } = request.query as { dryRun?: string };
      const servingRuntime = request.body as ServingRuntimeKind;
      try {
        const response = await fastify.kube.customObjectsApi.createNamespacedCustomObject(
          'serving.kserve.io',
          'v1alpha1',
          servingRuntime.metadata.namespace,
          'servingruntimes',
          servingRuntime,
          undefined,
          dryRun,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Servingruntime ${servingRuntime.metadata.name} could not be created, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );
};
