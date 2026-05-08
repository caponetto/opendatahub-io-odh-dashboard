import { join } from 'path';
import fp from 'fastify-plugin';
import autoload from '@fastify/autoload';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(
    async (instance: FastifyInstance) => {
      await instance.register(autoload, {
        dir: join(__dirname, 'api'),
        ignorePattern: /^__tests__$|\.(spec|test)\.(ts|js|cjs|mjs)$/,
        ignoreFilter: (routePath: string) => /(^|[\\/])__tests__([\\/]|$)/.test(routePath),
      });
    },
    { prefix: '/api' },
  );
});
