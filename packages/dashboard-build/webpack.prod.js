const path = require('path');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const rimraf = require('rimraf');
const { setupWebpackDotenvFilesForEnv } = require('./dotenv');
const { createWebpackCommon, getHoistedNodeModulesRoot } = require('./webpack.common.js');

/**
 * @param {Object} options
 * @param {string} options.srcDir
 * @param {string} options.distDir
 * @param {string} options.commonDir
 * @param {string} options.assemblerDir
 * @param {boolean} options.isRoot
 * @param {Object} options.deps
 * @param {Object} [options.hostPackageJson]
 * @param {string} options.productName
 * @param {string} options.favicon
 * @param {string} options.imagesDir
 * @param {string} [options.publicPath]
 * @param {boolean} [options.outputOnly]
 * @param {boolean} [options.coverage]
 * @param {boolean} [options.mfDev]
 */
const createWebpackProd = (options) => {
  const { assemblerDir, srcDir, distDir, commonDir, isRoot, outputOnly = false } = options;

  const nodeModulesRoot = getHoistedNodeModulesRoot(assemblerDir);

  if (!outputOnly) {
    console.info(`Cleaning OUTPUT DIR...\n  ${distDir}\n`);
  }

  rimraf(distDir, () => {});

  return merge(
    {
      plugins: [
        ...setupWebpackDotenvFilesForEnv({
          directory: assemblerDir,
          env: 'production',
          isRoot,
        }),
      ],
    },
    createWebpackCommon(options)('production'),
    {
      mode: 'production',
      devtool: 'source-map',
      optimization: {
        minimize: true,
        minimizer: [new TerserJSPlugin(), new CssMinimizerPlugin()],
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[name].bundle.css',
          ignoreOrder: true,
        }),
      ],
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
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
          },
        ],
      },
    },
  );
};

module.exports = { createWebpackProd };
