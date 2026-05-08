/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/restrict-template-expressions */
import { FastifyReply, FastifyRequest } from 'fastify';
import { PatchUtils } from '@kubernetes/client-node';
import {
  KubeFastifyInstance,
  RecursivePartial,
  Template,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';

type RouteError = { response?: { body?: { message?: string } }; message?: string };

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/:namespace/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };
      try {
        const response = await fastify.kube.customObjectsApi.getNamespacedCustomObject(
          'template.openshift.io',
          'v1',
          namespace,
          'templates',
          name,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Template ${name} could not be read, ${err.response?.body?.message || err.message}`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.get(
    '/:namespace',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace } = request.params as { namespace: string };
      const { labelSelector } = request.query as { labelSelector: string };
      try {
        const response = await fastify.kube.customObjectsApi.listNamespacedCustomObject(
          'template.openshift.io',
          'v1',
          namespace,
          'templates',
          undefined,
          undefined,
          undefined,
          labelSelector,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Templates could not be listed, ${err.response?.body?.message || err.message}`,
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
      const template = request.body as Template;
      try {
        const response = await fastify.kube.customObjectsApi.createNamespacedCustomObject(
          'template.openshift.io',
          'v1',
          template.metadata.namespace,
          'templates',
          template,
          undefined,
          dryRun,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Template ${template.metadata.name} could not be created, ${
            err.response?.body?.message || err.message
          }`,
        );
        reply.send(e);
        return undefined;
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
      try {
        const response = await fastify.kube.customObjectsApi.patchNamespacedCustomObject(
          'template.openshift.io',
          'v1',
          namespace,
          'templates',
          name,
          request.body as RecursivePartial<Template>,
          undefined,
          undefined,
          undefined,
          options,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Template ${name} could not be modified, ${err.response?.body?.message || err.message}`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );

  fastify.delete(
    '/:namespace/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };
      try {
        const response = await fastify.kube.customObjectsApi.deleteNamespacedCustomObject(
          'template.openshift.io',
          'v1',
          namespace,
          'templates',
          name,
        );
        return response.body;
      } catch (e: unknown) {
        const err = e as RouteError;
        fastify.log.error(
          `Template ${name} could not be deleted, ${err.response?.body?.message || err.message}`,
        );
        reply.send(e);
        return undefined;
      }
    }),
  );
};
