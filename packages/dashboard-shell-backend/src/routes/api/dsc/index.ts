import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { getClusterStatus } from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async () => getClusterStatus(fastify));
};
