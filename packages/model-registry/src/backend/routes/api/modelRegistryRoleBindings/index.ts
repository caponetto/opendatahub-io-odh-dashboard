/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/restrict-template-expressions */
import { FastifyReply, FastifyRequest } from 'fastify';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { V1RoleBinding } from '@kubernetes/client-node';
import {
  createModelRegistryRoleBinding,
  deleteModelRegistriesRolebinding,
  listModelRegistryRoleBindings,
} from './modelRegistryRolebindingsUtils';
import { getModelRegistryNamespace } from '../modelRegistries/modelRegistryUtils';

type RouteError = {
  response?: { body?: { message?: string }; statusCode?: number };
  message?: string;
};

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    `/`,
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const mrNamespace = getModelRegistryNamespace(fastify);
        return await listModelRegistryRoleBindings(fastify, mrNamespace);
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistry RoleBindings could not be listed, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.post(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const rbRequest = request.body as V1RoleBinding;
      try {
        const mrNamespace = getModelRegistryNamespace(fastify);
        return await createModelRegistryRoleBinding(fastify, rbRequest, mrNamespace);
      } catch (e: unknown) {
        const err = e as RouteError;
        if (err.response?.statusCode === 409) {
          fastify.log.warn(`Rolebinding already present, skipping creation.`);
          return {};
        }

        fastify.log.error(
          `rolebinding could not be created: ${err.response?.body?.message || err.message}`,
        );
        reply.send(new Error(err.response?.body?.message));
        return undefined;
      }
    }),
  );

  fastify.delete(
    '/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const modelRegistryNamespace = getModelRegistryNamespace(fastify);
      const { name } = request.params as { name: string };
      try {
        const mrNamespace = getModelRegistryNamespace(fastify);
        return await deleteModelRegistriesRolebinding(fastify, name, mrNamespace);
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `RoleBinding ${name} could not be deleted from ${modelRegistryNamespace}, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );
};
