/* eslint-disable @typescript-eslint/consistent-type-assertions -- Fastify body / narrow throws */
import https from 'https';
import { FastifyReply, FastifyRequest } from 'fastify';
import { setImpersonateAccessToken } from '@odh-dashboard/dashboard-foundation-backend/devFlags';
import { KubeFastifyInstance } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import {
  DEV_IMPERSONATE_PASSWORD,
  DEV_IMPERSONATE_USER,
  DEV_OAUTH_PREFIX,
} from '@odh-dashboard/dashboard-foundation-backend/constants';
import { createCustomError } from '@odh-dashboard/dashboard-foundation-backend/requestUtils';
import { devRoute } from '@odh-dashboard/dashboard-foundation-backend/route-security';

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  fastify.post(
    '/',
    devRoute(async (request: FastifyRequest, reply: FastifyReply) => {
      void reply;
      return new Promise<{ code: number; response: string }>((resolve, reject) => {
        const doImpersonate = (request.body as { impersonate: boolean }).impersonate;
        if (doImpersonate) {
          const cluster = fastify.kube.config.getCurrentCluster();
          const apiPath = cluster?.server;
          if (!apiPath || !apiPath.startsWith('https://api.')) {
            reject({
              code: 500,
              response: 'Invalid cluster API URL for impersonate flow.',
            });
            return;
          }
          const namedHost = apiPath.slice('https://api.'.length).split(':')[0];
          const url = `https://${DEV_OAUTH_PREFIX}.${namedHost}/oauth/authorize?response_type=token&client_id=openshift-challenging-client`;
          // Custom call, don't use proxy
          const httpsRequest = https
            .get(
              url,
              {
                headers: {
                  // This usage of toString is fine for internal dev flows
                  // eslint-disable-next-line no-restricted-properties
                  Authorization: `Basic ${Buffer.from(
                    `${String(DEV_IMPERSONATE_USER ?? '')}:${String(
                      DEV_IMPERSONATE_PASSWORD ?? '',
                    )}`,
                  ).toString('base64')}`,
                },
              },
              (res) => {
                // 302 Found means the success of this call
                if (res.statusCode === 302) {
                  /**
                   * we will get the location in the headers like:
                   * https://oauth-openshift.apps.juntwang.dev.datahub.redhat.com/oauth/token/implicit#access_token={ACCESS_TOKEN_WE_WANT}
                   * &expires_in=86400&scope=user%3Afull&token_type=Bearer
                   */
                  const location = res.headers.location ?? '';
                  const hashPart = location.split('#')[1] ?? '';
                  const searchParams = new URLSearchParams(hashPart);
                  const accessToken = searchParams.get('access_token');
                  if (accessToken) {
                    setImpersonateAccessToken(accessToken);
                    resolve({ code: 200, response: accessToken });
                  } else {
                    reject({
                      code: 500,
                      response: 'Cannot fetch the impersonate token from the server.',
                    });
                  }
                } else {
                  reject({
                    code: 403,
                    response:
                      'Authorization error, please check the username and password in your local env file.',
                  });
                }
              },
            )
            .on('error', () => {
              reject({
                code: 500,
                response: 'There are some errors on the server, please try again later.',
              });
            });
          httpsRequest.end();
        } else {
          setImpersonateAccessToken('');
          resolve({ code: 200, response: '' });
        }
      }).catch((e: unknown) => {
        if (
          typeof e === 'object' &&
          e !== null &&
          'code' in e &&
          typeof (e as { code: unknown }).code === 'number'
        ) {
          const { code, response } = e as { code: number; response?: string };
          throw createCustomError(
            'Error impersonating user',
            response ?? 'Impersonating user error',
            code,
          );
        }
        throw e;
      });
    }),
  );
};
