import * as fs from 'fs';
import { KubeFastifyInstance, OauthFastifyRequest } from './backendTypes';
import { LOG_DIR } from './constants';
import { getUserInfo } from './userUtils';
import { isUserAdmin } from './adminUtils';

export type AdminLogRecord = {
  user: string;
  namespace: string;
  action: string;
  endpoint: string;
  isAdmin: boolean;
  needsAdmin: boolean;
};

export const logRequestDetails = (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  routeNeedsAdmin?: boolean,
): void => {
  const data: Omit<AdminLogRecord, 'user' | 'isAdmin'> = {
    namespace: fastify.kube.namespace,
    action: request.method.toUpperCase(),
    endpoint: request.url.replace(String(request.headers.origin ?? ''), ''),
    needsAdmin: routeNeedsAdmin ?? false,
  };

  const writeLogAsync = async () => {
    const userInfo = await getUserInfo(fastify, request);
    const isAdmin = await isUserAdmin(fastify, request);

    writeAdminLog(fastify, {
      ...data,
      user: userInfo.userName,
      isAdmin,
    });
  };
  // break the thread so the request is not held up logging / determing permissions of the user
  setTimeout(
    () =>
      writeLogAsync().catch((e: unknown) =>
        fastify.log.error(`Error writing log. ${e instanceof Error ? e.message : String(e)}`),
      ),
    0,
  );
};

export const writeAdminLog = (fastify: KubeFastifyInstance, data: AdminLogRecord): void => {
  try {
    fs.appendFile(
      `${LOG_DIR}/adminActivity.log`,
      `${new Date().toISOString()}: ${JSON.stringify(data)}\n`,
      (err) => {
        if (err) {
          fastify.log.error(err, 'ERROR: Unable to write to admin log');
        }
      },
    );
  } catch (e) {
    fastify.log.error('Failed to log admin activity!');
  }
};
