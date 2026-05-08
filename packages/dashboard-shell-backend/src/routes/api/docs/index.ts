import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { listDocs } from './list';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) =>
    listDocs(fastify, request)
      .then((res) => res)
      .catch((res) => {
        reply.send(res);
      }),
  );
};
