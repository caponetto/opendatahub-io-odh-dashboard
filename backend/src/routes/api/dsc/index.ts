import { FastifyReply } from 'fastify';
import { KubeFastifyInstance } from '../../../types';
import { getClusterStatus } from '../../../utils/resourceUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async (_req, reply: FastifyReply) => {
    const status = getClusterStatus(fastify);
    if (status) {
      return status;
    }
    return reply.code(404).send();
  });
};
