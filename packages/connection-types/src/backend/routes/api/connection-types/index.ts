/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { V1ConfigMap } from '@kubernetes/client-node';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  KubeFastifyInstance,
  RecursivePartial,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import {
  getConnectionType,
  listConnectionTypes,
  createConnectionType,
  updateConnectionType,
  patchConnectionType,
  deleteConnectionType,
} from './connectionTypeUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) =>
    listConnectionTypes(fastify)
      .then((res) => res)
      .catch((res) => {
        reply.send(res);
      }),
  );

  fastify.get('/:name', async (request: FastifyRequest, reply: FastifyReply) =>
    getConnectionType(fastify, (request.params as { name: string }).name)
      .then((res) => res)
      .catch((res) => {
        reply.send(res);
      }),
  );

  fastify.post(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      createConnectionType(fastify, request.body as V1ConfigMap)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );

  fastify.put(
    '/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      updateConnectionType(
        fastify,
        (request.params as { name: string }).name,
        request.body as V1ConfigMap,
      )
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );

  fastify.patch(
    '/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      patchConnectionType(
        fastify,
        (request.params as { name: string }).name,
        request.body as RecursivePartial<V1ConfigMap>,
      )
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );

  fastify.delete(
    '/:name',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      deleteConnectionType(fastify, (request.params as { name: string }).name)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
