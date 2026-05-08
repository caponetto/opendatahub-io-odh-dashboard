import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { getSegmentKey } from './segmentKeyUtils';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return getSegmentKey(fastify)
      .then((res) => {
        return res;
      })
      .catch((res) => {
        reply.send(res);
      });
  });
};
