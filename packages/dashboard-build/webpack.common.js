/* eslint-disable prefer-destructuring */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');
const { setupWebpackDotenvFilesForEnv } = require('./dotenv');
const { createModuleFederationPlugins, getModuleFederationConfig } = require('./moduleFederation');
const { getPluginPackageDetails } = require('./discoverPluginPackages');
const { getExtensionChunksFilter, getPluginChunkName } = require('./pluginChunking');
const { generateManifest } = require('./generatePluginManifest');
const GenerateExtensionsPlugin = require('./generateExtensionsPlugin');

/**
 * Resolve hoisted workspace node_modules (e.g. repo root when assembler is under packages/).
 *
 * @param {string} assemblerDir
 * @returns {string}
 */
const getHoistedNodeModulesRoot = (assemblerDir) => {
  try {
    return path.join(
      path.dirname(require.resolve('webpack/package.json', { paths: [assemblerDir] })),
      '..',
    );
  } catch {
    return path.resolve(assemblerDir, '..', 'node_modules');
  }
};

/**
 * @param {Object} options
 * @param {string} options.srcDir - Absolute path to assembler's src/
 * @param {string} options.distDir - Absolute path to output directory
 * @param {string} [options.publicPath] - Public path (default '/')
 * @param {string} options.assemblerDir - Absolute path to assembler root (for plugin discovery)
 * @param {string} options.commonDir - Absolute path to packages dir
 * @param {string} options.productName - Product name for HTML title
 * @param {string} options.favicon - Favicon filename inside imagesDir
 * @param {string} options.imagesDir - Absolute path to the source images directory
 * @param {boolean} options.isRoot - Whether this is the project root
 * @param {Object} options.deps - Dependencies from assembler package.json
 * @param {Object} [options.hostPackageJson] - The host/internal package.json for MF shared deps
 * @param {boolean} [options.coverage] - Enable coverage istanbul loader
 * @param {boolean} [options.mfDev] - Expose MF_REMOTES EnvironmentPlugin outside development
 * @param {boolean} [options.outputOnly] - Suppress info logging
 * @param {string[]} [options.imagesFilter] - Glob patterns to select which images to copy (default: all)
 * @param {boolean} [options.disableMonaco] - Skip MonacoWebpackPlugin entirely
 */
const createWebpackCommon = (options) => {
  const {
    srcDir,
    distDir,
    publicPath = '/',
    assemblerDir,
    commonDir,
    productName,
    favicon,
    imagesDir,
    isRoot,
    deps,
    hostPackageJson,
    coverage = false,
    mfDev = false,
    outputOnly = false,
    imagesFilter,
    disableMonaco = false,
  } = options;

  const imagesDirname = path.basename(imagesDir);
  const nodeModulesRoot = getHoistedNodeModulesRoot(assemblerDir);
  const pluginsDir = path.join(path.dirname(commonDir), 'plugins');

  let COMMIT_HASH_DIRECT;

  try {
    COMMIT_HASH_DIRECT = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Unable to get git commit hash:', error.message);
    COMMIT_HASH_DIRECT = 'unknown';
  }

  const manifest = generateManifest();
  const manifestPath = path.join(__dirname, '.plugin-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const pluginPackageDetails = getPluginPackageDetails(assemblerDir);

  if (pluginPackageDetails.length === 0) {
    console.warn(
      'Warning: No plugin packages discovered. The pluginChunks splitChunks group will have no effect. ' +
        'Check that workspace packages have ./extensions exports and that npm query is working.',
    );
  }

  if (!outputOnly) {
    console.info(
      `\nPrepping files...\n  SRC DIR: ${srcDir}\n  OUTPUT DIR: ${distDir}\n  PUBLIC PATH: ${publicPath}\n`,
    );
    console.info(
      'Plugin chunk groups:',
      pluginPackageDetails.map((p) => p.shortName),
    );
    if (coverage) {
      console.info('\nAdding code coverage instrumentation.\n');
    }
  }

  const mfConfig = getModuleFederationConfig(assemblerDir);
  if (!outputOnly && mfConfig.length > 0) {
    console.info(
      'Federated modules:',
      mfConfig.map((c) => c.name),
    );
  }
  const moduleFederationPlugins = createModuleFederationPlugins({
    deps,
    hostPackageJson,
    assemblerDir,
  });

  const localEntry = path.join(srcDir, 'index.tsx');
  const shellEntry = (() => {
    try {
      // eslint-disable-next-line n/no-extraneous-require -- resolved from assemblerDir, not dashboard-build
      return require.resolve('@odh-dashboard/dashboard-shell-frontend/entry', {
        paths: [assemblerDir],
      });
    } catch {
      return null;
    }
  })();

  return (env) => ({
    entry: {
      app: fs.existsSync(localEntry) ? localEntry : shellEntry || localEntry,
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|jsx|js)?$/,
          exclude: [/node_modules\/(?!@odh-dashboard)/, /__tests__/, /__mocks__/],
          include: [srcDir, commonDir, pluginsDir],
          use: [
            ...(coverage ? ['@jsdevtools/coverage-istanbul-loader'] : []),
            env === 'development'
              ? { loader: 'swc-loader' }
              : {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true,
                  },
                },
          ],
        },
        {
          test: /\.(svg|ttf|eot|woff|woff2)$/,
          include: [
            path.resolve(nodeModulesRoot, 'patternfly/dist/fonts'),
            path.resolve(nodeModulesRoot, '@patternfly/react-core/dist/styles/assets/fonts'),
            path.resolve(nodeModulesRoot, '@patternfly/react-core/dist/styles/assets/pficon'),
            path.resolve(nodeModulesRoot, '@patternfly/patternfly/assets/fonts'),
            path.resolve(nodeModulesRoot, '@patternfly/patternfly/assets/pficon'),
            path.resolve(nodeModulesRoot, 'monaco-editor'),
            path.resolve(nodeModulesRoot, '@fontsource'),
          ],
          use: {
            loader: 'file-loader',
            options: {
              limit: 5000,
              outputPath: 'fonts',
              name: '[name].[ext]',
            },
          },
        },
        {
          test: /\.svg$/,
          include: (input) => input.indexOf('background-filter.svg') > 1,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 5000,
                outputPath: 'svgs',
                name: '[name].[ext]',
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          include: (input) => input.indexOf(imagesDirname) > -1,
          use: {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          },
        },
        {
          test: /\.svg$/,
          include: (input) =>
            input.indexOf(imagesDirname) === -1 &&
            input.indexOf('fonts') === -1 &&
            input.indexOf('background-filter') === -1 &&
            input.indexOf('pficon') === -1,
          use: {
            loader: 'raw-loader',
            options: {},
          },
        },
        {
          test: /\.(jpg|jpeg|png|gif)$/i,
          include: [
            srcDir,
            commonDir,
            path.resolve(nodeModulesRoot, 'patternfly'),
            path.resolve(nodeModulesRoot, '@patternfly/patternfly/assets/images'),
            path.resolve(nodeModulesRoot, '@patternfly/react-styles/css/assets/images'),
            path.resolve(nodeModulesRoot, '@patternfly/react-core/dist/styles/assets/images'),
            path.resolve(
              nodeModulesRoot,
              '@patternfly/react-core/node_modules/@patternfly/react-styles/css/assets/images',
            ),
            path.resolve(
              nodeModulesRoot,
              '@patternfly/react-table/node_modules/@patternfly/react-styles/css/assets/images',
            ),
            path.resolve(
              nodeModulesRoot,
              '@patternfly/react-inline-edit-extension/node_modules/@patternfly/react-styles/css/assets/images',
            ),
          ],
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 5000,
                outputPath: 'images',
                name: '[name].[ext]',
              },
            },
          ],
        },
        {
          test: /\.s[ac]ss$/i,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.css$/i,
          exclude: /node_modules\/monaco-editor|@patternfly/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.ya?ml$/,
          use: 'js-yaml-loader',
        },
      ],
    },
    output: {
      filename: '[name].bundle.js',
      path: distDir,
      publicPath,
      chunkFilename: '[name]-[chunkhash].js',
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          pluginChunks: {
            test(module) {
              return pluginPackageDetails.some(
                (pkg) => module.resource && module.resource.startsWith(`${pkg.location}/`),
              );
            },
            name: getPluginChunkName(pluginPackageDetails),
            chunks: getExtensionChunksFilter(pluginPackageDetails),
            enforce: true,
            priority: 10,
          },
        },
      },
    },
    plugins: [
      new GenerateExtensionsPlugin({
        assemblerDir,
        targetFile: path.join(
          commonDir,
          'dashboard-shell-frontend',
          'src',
          'plugins',
          'plugin-extensions.ts',
        ),
      }),
      ...setupWebpackDotenvFilesForEnv({
        directory: assemblerDir,
        isRoot,
      }),
      new HtmlWebpackPlugin({
        template: fs.existsSync(path.join(srcDir, 'index.html'))
          ? path.join(srcDir, 'index.html')
          : path.join(__dirname, 'templates/index.html'),
        title: productName,
        favicon: path.join(imagesDir, favicon),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(srcDir, 'locales'),
            to: path.join(distDir, 'locales'),
            noErrorOnMissing: true,
          },
          {
            from: path.join(srcDir, 'favicons'),
            to: path.join(distDir, 'favicons'),
            noErrorOnMissing: true,
          },
          {
            from: imagesDir,
            to: path.join(distDir, imagesDirname),
            noErrorOnMissing: true,
            ...(imagesFilter
              ? {
                  filter: (resourcePath) =>
                    imagesFilter.some((pattern) => {
                      const name = path.basename(resourcePath);
                      if (pattern.includes('*')) {
                        const regex = new RegExp(
                          `^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`,
                        );
                        return regex.test(name);
                      }
                      return name === pattern;
                    }),
                }
              : {}),
          },
          {
            from: path.join(srcDir, 'favicon.ico'),
            to: path.join(distDir),
            noErrorOnMissing: true,
          },
          {
            from: path.join(srcDir, 'favicon.png'),
            to: path.join(distDir),
            noErrorOnMissing: true,
          },
          {
            from: path.join(srcDir, 'manifest.json'),
            to: path.join(distDir),
            noErrorOnMissing: true,
          },
          {
            from: path.join(srcDir, 'robots.txt'),
            to: path.join(distDir),
            noErrorOnMissing: true,
          },
        ],
      }),
      !disableMonaco &&
        new MonacoWebpackPlugin({
          languages: ['yaml'],
        }),
      new webpack.DefinePlugin({
        __COMMIT_HASH__: JSON.stringify(COMMIT_HASH_DIRECT),
      }),
      env === 'development' || mfDev
        ? new webpack.EnvironmentPlugin({
            MF_REMOTES: JSON.stringify(
              mfConfig
                .filter((c) => !!c.backend)
                .map((c) => ({
                  name: c.name,
                  remoteEntry: c.backend.remoteEntry,
                  ...(c._packageName && { packageName: c._packageName }),
                })),
            ),
          })
        : undefined,
      ...moduleFederationPlugins,
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.jsx'],
      symlinks: true,
      cacheWithContext: false,
      alias: {
        lodash$: 'lodash-es',
      },
    },
  });
};

module.exports = { createWebpackCommon, getHoistedNodeModulesRoot };
