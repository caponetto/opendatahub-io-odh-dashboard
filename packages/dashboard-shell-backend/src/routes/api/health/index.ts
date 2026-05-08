import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { health } from './healthUtils';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  // Unsecured route for health check
  fastify.get('/', async () => health(fastify));
};
