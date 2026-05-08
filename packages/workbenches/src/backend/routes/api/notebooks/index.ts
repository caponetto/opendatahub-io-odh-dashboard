/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  KubeFastifyInstance,
  NotebookData,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { NotebookState } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import {
  stopNotebook,
  getNotebook,
} from '@odh-dashboard/dashboard-foundation-backend/notebookUtils';
import { getNotebookStatus, enableNotebook } from './utils';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/:namespace/:name',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };
      return getNotebook(fastify, namespace, name).catch((e) => {
        if (e.statusCode !== 404) {
          fastify.log.error(
            `Failed get notebook status, ${e.response?.body?.message || e.message}}`,
          );
        }
        reply.status(404).send(e.response?.body?.message || e.message);
      });
    }),
  );

  fastify.get(
    '/:namespace/:name/status',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      const { namespace, name } = request.params as { namespace: string; name: string };

      return getNotebookStatus(fastify, namespace, name).catch((e) => {
        if (e.statusCode !== 404) {
          fastify.log.error(
            `Failed get notebook status, ${e.response?.body?.message || e.message}}`,
          );
        }
        reply.status(404).send(e.response?.body?.message || e.message);
      });
    }),
  );

  fastify.post(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      if ((request.body as NotebookData).state !== NotebookState.Started) {
        reply.status(400).send('Failed to start the Notebook');
      }

      return enableNotebook(fastify, request as FastifyRequest<{ Body: NotebookData }>).catch(
        (e) => {
          fastify.log.error(`${e.response?.body?.message || e.message}}`);
          reply.status(400).send(e.response?.body?.message || e.message);
        },
      );
    }),
  );

  fastify.patch(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      if ((request.body as NotebookData).state !== NotebookState.Stopped) {
        reply.status(400).send('Failed to stop the Notebook');
      }

      return stopNotebook(fastify, request as FastifyRequest<{ Body: NotebookData }>).catch((e) => {
        fastify.log.error(`Failed to delete notebook, ${e.response?.body?.message || e.message}}`);
        reply.status(400).send(e.response?.body?.message || e.message);
      });
    }),
  );
};
