import { DEV_MODE, USER_ACCESS_TOKEN } from './constants';
import { KubeFastifyInstance, OauthFastifyRequest, PlatformType } from '../types';
import { getImpersonateAccessToken, isImpersonating } from '../devFlags';
import type { FastifyRequest } from 'fastify';

export const getAccessToken = (options: Partial<FastifyRequest>): string | undefined =>
  typeof options.headers?.Authorization === 'string'
    ? options.headers.Authorization.match(/^Bearer (.*?)$/)[1]
    : undefined;

export type DirectCallOptions = {
  headers: Record<string, string>;
  ca?: string | Buffer;
  cert?: string | Buffer;
  key?: string | Buffer;
  rejectUnauthorized?: boolean;
};

export const getDirectCallOptions = async (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  url: string,
): Promise<DirectCallOptions> => {
  const kc = fastify.kube.config;
  const kubeOptions: Parameters<typeof kc.applyToRequest>[0] = { url };
  await kc.applyToRequest(kubeOptions);
  const {
    headers: kubeHeaders,
    ca,
    cert,
    key,
    rejectUnauthorized,
  } = kubeOptions as Record<string, any>;

  let headers;
  if (DEV_MODE) {
    headers = kubeHeaders;
    if (isImpersonating() && !url.includes('thanos-querier-openshift-monitoring')) {
      headers = {
        ...kubeHeaders,
        Authorization: `Bearer ${getImpersonateAccessToken()}`,
      };
    }
  } else {
    const accessToken = request.headers[USER_ACCESS_TOKEN];
    if (!accessToken) {
      if (fastify.kube.platform !== PlatformType.OpenShift) {
        // On vanilla Kubernetes there is no OAuth proxy; use the service account
        // credentials that kc.applyToRequest already placed in kubeHeaders.
        headers = kubeHeaders;
      } else {
        fastify.log.error(
          `No ${USER_ACCESS_TOKEN} header. Cannot make a pass through call as this user.`,
        );
        throw new Error('No access token provided by oauth. Cannot make any API calls to kube.');
      }
    } else {
      headers = {
        ...kubeHeaders,
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  return {
    headers,
    ...(ca != null && { ca }),
    ...(cert != null && { cert }),
    ...(key != null && { key }),
    ...(rejectUnauthorized != null && { rejectUnauthorized }),
  };
};
