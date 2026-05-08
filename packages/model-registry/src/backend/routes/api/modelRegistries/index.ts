/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/restrict-template-expressions */
import { FastifyReply, FastifyRequest } from 'fastify';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import {
  KubeFastifyInstance,
  ModelRegistryKind,
  RecursivePartial,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import createError from 'http-errors';
import {
  createModelRegistryAndCredentials,
  deleteModelRegistryAndSecret,
  getDatabasePassword,
  getModelRegistry,
  getModelRegistryNamespace,
  listModelRegistries,
  patchModelRegistryAndUpdateCredentials,
} from './modelRegistryUtils';

type ModelRegistryAndCredentials = {
  modelRegistry: ModelRegistryKind;
  databasePassword?: string;
  newDatabaseCACertificate?: string;
};

type RouteError = {
  response?: { body?: { message?: string } };
  message?: string;
  statusCode?: number;
  body?: { message?: string };
};

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { labelSelector } = request.query as { labelSelector: string };
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        return await listModelRegistries(fastify, modelRegistryNamespace, labelSelector);
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistries could not be listed, ${err.response?.body?.message || err.message}`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.post(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { dryRun } = request.query as { dryRun?: string };
      const { modelRegistry, databasePassword, newDatabaseCACertificate } =
        request.body as ModelRegistryAndCredentials;
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        return await createModelRegistryAndCredentials(
          fastify,
          modelRegistry,
          modelRegistryNamespace,
          databasePassword,
          newDatabaseCACertificate,
          !!dryRun,
        ).catch((e: RouteError) => {
          throw createError(e.statusCode ?? 500, e.body?.message ?? 'Unknown error');
        });
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistry ${modelRegistry.metadata.name} could not be created, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.get(
    '/:modelRegistryName',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { modelRegistryName } = request.params as { modelRegistryName: string };
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        const modelRegistry = await getModelRegistry(
          fastify,
          modelRegistryName,
          modelRegistryNamespace,
        );
        const databasePassword = await getDatabasePassword(
          fastify,
          modelRegistry,
          modelRegistryNamespace,
        );
        return { modelRegistry, databasePassword } satisfies ModelRegistryAndCredentials;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistry ${modelRegistryName} could not be read, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.patch(
    '/:modelRegistryName',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { dryRun } = request.query as { dryRun?: string };
      const { modelRegistryName } = request.params as { modelRegistryName: string };
      const {
        modelRegistry: patchBody,
        databasePassword,
        newDatabaseCACertificate,
      } = request.body as RecursivePartial<ModelRegistryAndCredentials>;
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        const modelRegistry = await patchModelRegistryAndUpdateCredentials(
          fastify,
          modelRegistryName,
          modelRegistryNamespace,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          patchBody!,
          databasePassword,
          newDatabaseCACertificate,
          !!dryRun,
        );
        return { modelRegistry, databasePassword };
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistry ${modelRegistryName} could not be modified, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.delete(
    '/:modelRegistryName',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { dryRun } = request.query as { dryRun?: string };
      const { modelRegistryName } = request.params as { modelRegistryName: string };
      try {
        const modelRegistryNamespace = getModelRegistryNamespace(fastify);
        return await deleteModelRegistryAndSecret(
          fastify,
          modelRegistryName,
          modelRegistryNamespace,
          !!dryRun,
        );
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `ModelRegistry ${modelRegistryName} could not be deleted, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );
};
