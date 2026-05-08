import https from 'https';
import http from 'http';
import { getDirectCallOptions } from './directCallUtils';
import { KubeFastifyInstance, OauthFastifyRequest } from './backendTypes';
import { DEV_MODE } from './constants';

export enum ProxyErrorType {
  /** Failed during startup */
  SETUP_FAILURE,
  /** Failed at the http call level */
  HTTP_FAILURE,
  /** Failed after the connection was made but the request terminated before finishing */
  CALL_FAILURE,
}

export class ProxyError extends Error {
  public proxyErrorType: ProxyErrorType;

  constructor(type: ProxyErrorType, message: string) {
    super(message);

    this.proxyErrorType = type;
  }
}

type ProxyData = {
  method: string;
  url: string;
  requestData?: string | Buffer;
  /** Option to substitute your own content type for the API call -- defaults to JSON */
  overrideContentType?: string;
};

/** Ideally these would all be required, but https by node seems to think there are cases when it does not know the code or message */
export type ProxyCallStatus = {
  message?: string;
  code?: number;
};

/** Make a very basic pass-on / proxy call to another endpoint */
export const proxyCall = (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  data: ProxyData,
): Promise<[string, ProxyCallStatus]> => {
  return new Promise((resolve, reject) => {
    const { method, requestData, overrideContentType, url: targetUrl } = data;

    getDirectCallOptions(fastify, request, targetUrl)
      .then((requestOptions) => {
        const mergedOptions = { ...requestOptions };

        if (requestData) {
          let contentType: string;
          if (overrideContentType) {
            contentType = overrideContentType;
          } else {
            contentType = `application/${
              method === 'PATCH' ? 'json-patch+json' : 'json'
            };charset=UTF-8`;
          }

          mergedOptions.headers = {
            ...mergedOptions.headers,
            'Content-Type': contentType,
            'Content-Length': String(
              typeof requestData === 'string'
                ? Buffer.byteLength(requestData, 'utf8')
                : requestData.byteLength,
            ),
          };
        }

        fastify.log.info(`Making ${method} proxy request to ${targetUrl}`);

        const pickHttpModule = (requestUrl: string) => {
          if (requestUrl.startsWith('http:')) {
            if (!DEV_MODE) {
              throw new ProxyError(
                ProxyErrorType.SETUP_FAILURE,
                'Insecure HTTP requests are prohibited when not in development mode.',
              );
            }
            return http;
          }
          return https;
        };

        const httpsRequest = pickHttpModule(targetUrl)
          .request(targetUrl, { method, ...mergedOptions }, (res) => {
            const status: ProxyCallStatus = {
              message: res.statusMessage,
              code: res.statusCode,
            };
            let responseText = '';
            res
              .setEncoding('utf8')
              .on('data', (chunk) => {
                responseText += chunk;
              })
              .on('end', () => {
                resolve([responseText, status]);
              })
              .on('error', (error) => {
                reject(new ProxyError(ProxyErrorType.CALL_FAILURE, error.message));
              });
          })
          .on('error', (error) => {
            reject(new ProxyError(ProxyErrorType.HTTP_FAILURE, error.message));
          });

        if (requestData) {
          httpsRequest.write(requestData);
        }

        httpsRequest.end();
      })
      .catch((error) => {
        reject(new ProxyError(ProxyErrorType.SETUP_FAILURE, error.message));
      });
  });
};
