/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify request generics */
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  ClusterSettings,
  KubeFastifyInstance,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { secureAdminRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';
import { getClusterSettings, updateClusterSettings } from './clusterSettingsUtils';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return getClusterSettings(fastify, request)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          reply.send(res);
        });
    }),
  );

  fastify.put(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return updateClusterSettings(fastify, request as FastifyRequest<{ Body: ClusterSettings }>)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          reply.send(res);
        });
    }),
  );
};
