import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getModuleFederationConfigs } from '@odh-dashboard/dashboard-config';
import { DEV_MODE } from '@odh-dashboard/dashboard-foundation-backend/constants';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';

export default async (fastify: FastifyInstance, opts: { assemblerDir?: string }): Promise<void> => {
  let mfRemotesJson = '';
  try {
    const mfConfigs = getModuleFederationConfigs(DEV_MODE, opts.assemblerDir);
    const remotes = mfConfigs.flatMap((c) =>
      c.backend
        ? [
            {
              name: c.name,
              remoteEntry: c.backend.remoteEntry,
              ...(c.workspacePackage && { packageName: c.workspacePackage }),
            },
          ]
        : [],
    );
    mfRemotesJson = remotes.length > 0 ? JSON.stringify(remotes) : '';
  } catch (e: unknown) {
    fastify.log.error(errorHandler(e));
  }

  fastify.get('/*', async (_: FastifyRequest, reply: FastifyReply) =>
    reply.view('index.html', { mfRemotesJson }),
  );
};
