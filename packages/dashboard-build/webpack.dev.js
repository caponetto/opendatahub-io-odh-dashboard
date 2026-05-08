const { execSync } = require('child_process');
const path = require('path');
const { merge } = require('webpack-merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { setupWebpackDotenvFilesForEnv } = require('./dotenv');
const { createWebpackCommon, getHoistedNodeModulesRoot } = require('./webpack.common.js');

/**
 * @param {Object} options
 * @param {string} options.srcDir
 * @param {string} options.distDir
 * @param {string} options.commonDir
 * @param {string} options.assemblerDir
 * @param {string} [options.host] Dev server host (default 'localhost')
 * @param {string} [options.port] Dev server port (default '3000')
 * @param {string|number} [options.backendPort] Backend proxy port (default '8080')
 * @param {boolean} options.isRoot
 * @param {Object} options.deps
 * @param {Object} [options.hostPackageJson]
 * @param {string} options.productName
 * @param {string} options.favicon
 * @param {string} options.imagesDir
 * @param {string} [options.publicPath]
 * @param {boolean} [options.measure] SpeedMeasurePlugin (alternatively env MEASURE)
 */
const createWebpackDev = (options) => {
  const {
    srcDir,
    distDir,
    commonDir,
    assemblerDir,
    host = 'localhost',
    port = '3000',
    backendPort = '8080',
    measure,
  } = options;

  const nodeModulesRoot = getHoistedNodeModulesRoot(assemblerDir);
  const smp = new SpeedMeasurePlugin({ disable: !(measure ?? process.env.MEASURE) });

  const { getModuleFederationConfig } = require('./moduleFederation');
  const moduleFederationConfig = getModuleFederationConfig(assemblerDir);

  const mfProxies = moduleFederationConfig
    .map((config) => config.proxyService?.map((p) => p.path))
    .flat()
    .filter((p) => p);

  const webpackCommon = createWebpackCommon(options);

  return smp.wrap(
    merge(
      {
        plugins: [
          ...setupWebpackDotenvFilesForEnv({
            directory: assemblerDir,
            env: 'development',
            isRoot: options.isRoot,
          }),
        ],
      },
      webpackCommon('development'),
      {
        mode: 'development',
        devtool: 'eval-source-map',
        optimization: {
          runtimeChunk: 'single',
          removeEmptyChunks: true,
        },
        watchOptions: {
          ignored: [
            '**/node_modules',
            '**/dist',
            '**/public',
            '**/public-cypress',
            '**/coverage',
            '**/jest-coverage',
            '**/.nyc_output',
            '**/upstream',
            '**/__tests__',
          ],
        },
        devServer: {
          host,
          port,
          compress: true,
          historyApiFallback: true,
          hot: true,
          open: false,
          proxy: (() => {
            if (process.env.EXT_CLUSTER) {
              const devLegacy = process.env.DEV_LEGACY === 'true';
              let dashboardHost = process.env.ODH_DASHBOARD_HOST;
              let token;

              try {
                token = execSync('oc whoami --show-token', { stdio: ['pipe', 'pipe', 'ignore'] })
                  .toString()
                  .trim();
                const username = execSync('oc whoami', { stdio: ['pipe', 'pipe', 'ignore'] })
                  .toString()
                  .trim();
                console.info('Logged in as user:', username);
              } catch (e) {
                throw new Error('Login with `oc login` prior to starting dev server.');
              }

              let cachedToken = token;
              const tokenRefreshEnabled = process.env.ODH_TOKEN_REFRESH === 'true';

              const getCurrentToken = (() => {
                if (!tokenRefreshEnabled) {
                  return () => cachedToken;
                }

                let lastTokenFetch = Date.now();
                const TOKEN_REFRESH_MIN_INTERVAL = 5000;
                return () => {
                  const now = Date.now();
                  if (now - lastTokenFetch > TOKEN_REFRESH_MIN_INTERVAL) {
                    try {
                      const newToken = execSync('oc whoami --show-token', {
                        stdio: ['pipe', 'pipe', 'ignore'],
                      })
                        .toString()
                        .trim();
                      if (newToken !== cachedToken) {
                        console.info('Token refreshed (oc user may have switched)');
                        cachedToken = newToken;
                      }
                    } catch (e) {
                      console.warn('Failed to refresh oc token, using cached token');
                    } finally {
                      lastTokenFetch = now;
                    }
                  }
                  return cachedToken;
                };
              })();

              const odhProject = process.env.OC_PROJECT || 'opendatahub';
              const app = process.env.ODH_APP || 'odh-dashboard';
              console.info('Using project:', odhProject);

              if (dashboardHost) {
                console.info('Using explicit ODH_DASHBOARD_HOST:', dashboardHost);
              }

              try {
                const httpRouteJson = execSync(
                  `oc get httproutes -n ${odhProject} ${app} -o json`,
                  {
                    stdio: ['pipe', 'pipe', 'ignore'],
                  },
                ).toString();
                const httpRoute = JSON.parse(httpRouteJson);

                const parentRef = httpRoute?.status?.parents?.[0]?.parentRef;
                const gatewayName = parentRef?.name;
                const gatewayNamespace = parentRef?.namespace || odhProject;

                if (gatewayName && gatewayNamespace) {
                  const gatewayJson = execSync(
                    `oc get gateway -n ${gatewayNamespace} ${gatewayName} -o json`,
                    { stdio: ['pipe', 'pipe', 'ignore'] },
                  ).toString();
                  const gateway = JSON.parse(gatewayJson);

                  const listeners = gateway?.spec?.listeners || [];
                  const httpsListener = listeners.find((listener) => listener.name === 'https');
                  if (httpsListener && httpsListener.hostname) {
                    dashboardHost = httpsListener.hostname;
                  }
                }
              } catch (e) {
                // ignore
              }

              if (!dashboardHost) {
                try {
                  const routeJson = execSync(`oc get routes -n ${odhProject} ${app} -o json`, {
                    stdio: ['pipe', 'pipe', 'ignore'],
                  }).toString();
                  const route = JSON.parse(routeJson);
                  if (route?.spec?.to?.name !== 'dashboard-redirect') {
                    dashboardHost = route?.spec?.host;
                  }
                } catch (e) {
                  // ignore
                }
              }

              if (!dashboardHost) {
                const subdomain = devLegacy ? `${app}-${odhProject}` : `rh-ai`;
                console.info(
                  `Failed to GET dashboard hostname, constructing hostname using subdomain '${subdomain}'.`,
                );
                if (!devLegacy) {
                  console.info(
                    `Use DEV_LEGACY=true to override with legacy behavior. eg. DEV_LEGACY=true`,
                  );
                }
                dashboardHost = new URL(
                  execSync(`oc whoami --show-console`, {
                    stdio: ['pipe', 'pipe', 'ignore'],
                  }).toString(),
                ).host.replace(/^[^.]+\./, `${subdomain}.`);
              }

              console.info('Dashboard host:', dashboardHost);

              let shouldFwdAccessToken = false;
              try {
                const deploymentJson = execSync(
                  `oc get deployment -n ${odhProject} ${app} -o json`,
                  {
                    stdio: ['pipe', 'pipe', 'ignore'],
                  },
                ).toString();
                const deployment = JSON.parse(deploymentJson);
                const containers = deployment?.spec?.template?.spec?.containers || [];
                shouldFwdAccessToken = containers.some(
                  (container) =>
                    container.name === 'oauth-proxy' || container.image?.includes('oauth-proxy'),
                );
              } catch (e) {
                shouldFwdAccessToken = devLegacy;
              }

              const headers = {
                Authorization: `Bearer ${token}`,
              };
              if (shouldFwdAccessToken) {
                console.info('Supplying x-forwarded-access-token header');
                headers['x-forwarded-access-token'] = token;
              }

              return [
                {
                  context: ['/api', '/_mf', ...mfProxies],
                  target: `https://${dashboardHost}`,
                  secure: false,
                  changeOrigin: true,
                  headers,
                  onProxyReq: (proxyReq) => {
                    const currentToken = getCurrentToken();
                    proxyReq.setHeader('Authorization', `Bearer ${currentToken}`);
                    if (shouldFwdAccessToken) {
                      proxyReq.setHeader('x-forwarded-access-token', currentToken);
                    }
                  },
                },
                {
                  context: ['/wss/k8s'],
                  target: `wss://${dashboardHost}`,
                  secure: false,
                  ws: true,
                  changeOrigin: true,
                  headers,
                  onProxyReq: (proxyReq) => {
                    const currentToken = getCurrentToken();
                    proxyReq.setHeader('Authorization', `Bearer ${currentToken}`);
                    if (shouldFwdAccessToken) {
                      proxyReq.setHeader('x-forwarded-access-token', currentToken);
                    }
                  },
                },
              ];
            }
            return [
              {
                context: ['/api', '/_mf', ...mfProxies],
                target: `http://0.0.0.0:${backendPort}`,
              },
              {
                context: ['/wss/k8s'],
                target: `ws://0.0.0.0:${backendPort}`,
                ws: true,
              },
            ];
          })(),
          devMiddleware: {
            stats: 'errors-only',
          },
          client: {
            overlay: false,
          },
          static: {
            directory: distDir,
          },
          onListening: (devServer) => {
            if (devServer) {
              console.log(
                `\x1b[32m✓ ODH Dashboard available at: \x1b[4mhttp://localhost:${
                  devServer.server.address().port
                }\x1b[0m`,
              );
            }
          },
        },
        module: {
          rules: [
            {
              test: /\.css$/,
              include: [
                srcDir,
                commonDir,
                path.resolve(nodeModulesRoot, '@patternfly'),
                path.resolve(nodeModulesRoot, 'monaco-editor'),
              ],
              use: ['style-loader', 'css-loader'],
            },
          ],
        },
        plugins: [
          new ForkTsCheckerWebpackPlugin(),
          new ReactRefreshWebpackPlugin({ overlay: false }),
        ],
      },
    ),
  );
};

module.exports = { createWebpackDev };
