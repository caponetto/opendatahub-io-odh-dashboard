/* eslint-disable @typescript-eslint/consistent-type-assertions -- Enum from route param string */
import {
  KubeFastifyInstance,
  OauthFastifyRequest,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { logRequestDetails } from '@odh-dashboard/dashboard-foundation-backend/fileUtils';
import { applyNamespaceChange } from './namespaceUtils';
import { NamespaceApplicationCase } from './const';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/:name/:context',
    async (
      request: OauthFastifyRequest<{
        Params: { name: string; context: string };
        Querystring: { dryRun?: string };
      }>,
    ) => {
      logRequestDetails(fastify, request);

      const { name, context: contextAsString } = request.params;
      const { dryRun } = request.query;

      const context = parseInt(contextAsString) as NamespaceApplicationCase;

      return applyNamespaceChange(fastify, request, name, context, dryRun);
    },
  );
};
