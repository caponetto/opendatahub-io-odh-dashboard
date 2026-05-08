/**
 * Webpack configuration factory for dashboard assembler packages.
 * Provides a base config that can be extended per-variant.
 *
 * Usage in an assembler's webpack.config.js:
 *   const { createWebpackConfig } = require('@odh-dashboard/dashboard-shell-frontend/config/webpack');
 *   module.exports = createWebpackConfig({ ... });
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('@module-federation/enhanced');

/**
 * @typedef {Object} WebpackShellConfig
 * @property {string} entry - Path to the entry file (index.ts that imports bootstrap)
 * @property {string} outputPath - Output directory for built files
 * @property {string} publicPath - Public URL path (default: 'auto')
 * @property {string} [htmlTemplate] - Path to index.html template
 * @property {Object} [moduleFederation] - Module Federation config overrides
 * @property {string[]} [sharedDeps] - Additional shared dependencies
 */

/**
 * Creates a base webpack config suitable for a Dashboard assembler.
 * @param {WebpackShellConfig} config
 * @returns {import('webpack').Configuration}
 */
function createWebpackConfig(config) {
  const {
    entry,
    outputPath,
    publicPath = 'auto',
    htmlTemplate,
    moduleFederation,
    sharedDeps = [],
  } = config;

  const baseShared = {
    react: { singleton: true, requiredVersion: '*', eager: true },
    'react-dom': { singleton: true, requiredVersion: '*', eager: true },
    'react-router': { singleton: true, requiredVersion: '*', eager: true },
    'react-router-dom': { singleton: true, requiredVersion: '*', eager: true },
    '@patternfly/react-core': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/k8s-browser': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/plugin-core': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/dashboard-shell-frontend': {
      singleton: true,
      requiredVersion: '*',
      eager: true,
    },
  };

  const additionalShared = Object.fromEntries(
    sharedDeps.map((dep) => [dep, { singleton: true, requiredVersion: '*', eager: true }]),
  );

  const plugins = [];

  if (htmlTemplate) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: htmlTemplate,
        filename: 'index.html',
      }),
    );
  }

  if (moduleFederation !== false) {
    plugins.push(
      new ModuleFederationPlugin({
        name: 'host',
        filename: 'remoteEntry.js',
        exposes: {},
        shared: { ...baseShared, ...additionalShared },
        ...moduleFederation,
      }),
    );
  }

  return {
    entry,
    output: {
      path: outputPath,
      publicPath,
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins,
  };
}

/**
 * Creates a Module Federation config for a dashboard host application.
 * @param {Object} options
 * @param {string[]} options.remotePackages - Package names to configure as MF remotes
 * @param {Object} [options.shared] - Additional shared dep overrides
 * @returns {Object} Module Federation plugin config
 */
function createModuleFederationConfig(options = {}) {
  const { remotePackages = [], shared = {} } = options;

  return {
    name: 'host',
    filename: 'remoteEntry.js',
    exposes: {},
    remotes: Object.fromEntries(
      remotePackages.map((pkg) => [pkg, `${pkg}@/_mf/${pkg}/remoteEntry.js`]),
    ),
    shared,
  };
}

module.exports = { createWebpackConfig, createModuleFederationConfig };
