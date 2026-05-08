/* eslint-disable @typescript-eslint/consistent-type-assertions -- K8s / Fastify request shapes */
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { FastifyReply, FastifyRequest } from 'fastify';
import { V1RoleBinding } from '@kubernetes/client-node';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';

const isConflictError = (e: unknown): boolean =>
  typeof e === 'object' &&
  e !== null &&
  'response' in e &&
  (e as { response?: { statusCode?: number } }).response?.statusCode === 409;

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/:namespace/:name',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { name: rbName, namespace: rbNamespace } = request.params as {
        namespace: string;
        name: string;
      };
      try {
        const response = await fastify.kube.customObjectsApi.getNamespacedCustomObject(
          'rbac.authorization.k8s.io',
          'v1',
          rbNamespace,
          'rolebindings',
          rbName,
        );
        return response.body;
      } catch (e: unknown) {
        fastify.log.error(`rolebinding ${rbName} could not be read, ${errorHandler(e)}`);
        return reply.send(e);
      }
    }),
  );

  fastify.post(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const rbRequest = request.body as V1RoleBinding;
      const rbNamespace = rbRequest.metadata?.namespace ?? '';
      try {
        const response = await fastify.kube.customObjectsApi.createNamespacedCustomObject(
          'rbac.authorization.k8s.io',
          'v1',
          rbNamespace,
          'rolebindings',
          rbRequest,
        );
        return response.body;
      } catch (e: unknown) {
        if (isConflictError(e)) {
          fastify.log.warn(`Rolebinding already present, skipping creation.`);
          return {};
        }

        fastify.log.error(`rolebinding could not be created: ${errorHandler(e)}`);
        return reply.send(new Error(errorHandler(e)));
      }
    }),
  );
};
