import type { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  await fastify.register(require('./featureStores'));
  await fastify.register(require('./fsworkbenchIntegration'));
};
