import https from 'https';
import fs from 'fs';
import { fastify } from 'fastify';
import type { BackendConfig, ServerInstance } from './types';
import { initializeApp } from './app';
import { discoverPluginRoutes } from './discoverPluginRoutes';

export async function createBackendServer(config: BackendConfig): Promise<ServerInstance> {
  const {
    publicDir,
    assemblerDir,
    routeDirs: explicitRouteDirs,
    pluginDirs,
    port = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 8080,
    host = process.env.IP || '0.0.0.0',
    logLevel = process.env.FASTIFY_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
    isDev = process.env.APP_ENV === 'development',
    bodyLimit = 32 * 1024 * 1024,
  } = config;

  const discoveredRoutes = assemblerDir ? discoverPluginRoutes(assemblerDir) : [];
  const routeDirs = [...(explicitRouteDirs ?? []), ...discoveredRoutes];

  const app: ServerInstance = fastify({
    maxParamLength: 253,
    bodyLimit,
    logger: {
      level: logLevel,
      transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
      redact: [
        'err.response.request.headers.Authorization',
        'response.request.headers.Authorization',
        'request.headers.Authorization',
        'headers.Authorization',
        'Authorization',
      ],
    },
    pluginTimeout: 10000,
  });

  app.addContentTypeParser(
    'application/merge-patch+json',
    { parseAs: 'string' },
    function parseMergePatch(req, body, done) {
      try {
        const json = JSON.parse(String(body));
        done(null, json);
      } catch (err: unknown) {
        const error = Object.assign(
          new Error(err instanceof Error ? err.message : 'Invalid JSON'),
          { statusCode: 400 },
        );
        done(error, undefined);
      }
    },
  );

  await app.register(initializeApp, { publicDir, assemblerDir, routeDirs, pluginDirs });

  await app.listen({ port, host });

  const caPaths = [
    '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem',
    '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
    '/var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt',
    '/etc/pki/tls/certs/odh-ca-bundle.crt',
    '/etc/pki/tls/certs/odh-trusted-ca-bundle.crt',
  ]
    .map((caPath) => {
      try {
        return fs.readFileSync(caPath);
      } catch {
        return undefined;
      }
    })
    .filter((ca) => ca != null);

  if (caPaths.length > 0) {
    https.globalAgent.options.ca = caPaths;
  }

  app.log.info(`Server listening on ${host}:${port}`);
  return app;
}
