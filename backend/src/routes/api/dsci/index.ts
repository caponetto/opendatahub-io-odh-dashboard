import { FastifyReply } from 'fastify';
import { getClusterInitialization } from '../../../utils/dsci';
import { KubeFastifyInstance } from '../../../types';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async (_req, reply: FastifyReply) => {
    const status = await getClusterInitialization(fastify);
    if (!status) {
      return reply.code(404).send();
    }
    return status;
  });
};
