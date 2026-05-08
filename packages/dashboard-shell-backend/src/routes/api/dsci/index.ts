import { getClusterInitialization } from '@odh-dashboard/dashboard-foundation-backend/dsci';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async () => getClusterInitialization(fastify));
};
