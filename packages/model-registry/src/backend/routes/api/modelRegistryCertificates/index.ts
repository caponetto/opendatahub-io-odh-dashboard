/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FastifyReply, FastifyRequest } from 'fastify';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { listModelRegistryCertificateNames } from './modelRegistryCertificatesUtils';
import { getModelRegistryNamespace } from '../modelRegistries/modelRegistryUtils';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        return await listModelRegistryCertificateNames(fastify, modelRegistryNamespace);
      } catch (e: unknown) {
        const err = e as { response?: { body?: { message?: string } }; message?: string };
        fastify.log.error(
          `Model registry certificate names could not be listed, ${
            err.response?.body?.message ?? err.message ?? ''
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );
};
