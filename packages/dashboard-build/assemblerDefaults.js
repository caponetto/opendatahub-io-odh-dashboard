const path = require('path');
const { setupAssemblerDotenv } = require('./dotenv');
const { createWebpackDev } = require('./webpack.dev');
const { createWebpackProd } = require('./webpack.prod');

/**
 * Resolve the standard webpack options object from an assembler directory.
 * Reads env vars (after dotenv loading) and assembler package.json.
 *
 * @param {string} assemblerDir
 * @returns {Object} Options suitable for createWebpackDev / createWebpackProd
 */
const resolveAssemblerOptions = (assemblerDir) => {
  const SRC_DIR = path.resolve(assemblerDir, process.env.ODH_SRC_DIR || 'src');
  const COMMON_DIR = path.resolve(assemblerDir, process.env.ODH_COMMON_DIR || '../');
  const DIST_DIR = path.resolve(assemblerDir, process.env.ODH_DIST_DIR || 'public');
  const assemblerPkg = require(path.join(assemblerDir, 'package.json'));

  return {
    srcDir: SRC_DIR,
    distDir: DIST_DIR,
    commonDir: COMMON_DIR,
    assemblerDir,
    isRoot: false,
    deps: assemblerPkg.dependencies || {},
    productName: process.env.ODH_PRODUCT_NAME || 'Open Data Hub',
    favicon: process.env.ODH_FAVICON || 'odh-favicon.svg',
    imagesDir: path.resolve(COMMON_DIR, 'dashboard-foundation-frontend/src/images'),
    publicPath: process.env.ODH_PUBLIC_PATH || '/',
    imagesFilter: assemblerPkg.topology?.imagesFilter,
    disableMonaco: assemblerPkg.topology?.disableMonaco ?? false,
  };
};

/**
 * Create a development webpack config for an assembler with zero boilerplate.
 *
 * @param {string} assemblerDir - Absolute path to the assembler package root
 * @returns {Object} Webpack config
 */
const createDefaultWebpackDev = (assemblerDir) => {
  setupAssemblerDotenv({ assemblerDir, env: 'development' });

  return createWebpackDev({
    ...resolveAssemblerOptions(assemblerDir),
    host: process.env.ODH_HOST || 'localhost',
    port: process.env.ODH_PORT || '3000',
    backendPort: process.env.PORT || process.env.BACKEND_PORT || '8080',
  });
};

/**
 * Create a production webpack config for an assembler with zero boilerplate.
 *
 * @param {string} assemblerDir - Absolute path to the assembler package root
 * @returns {Object} Webpack config
 */
const createDefaultWebpackProd = (assemblerDir) => {
  setupAssemblerDotenv({ assemblerDir, env: 'production' });

  return createWebpackProd(resolveAssemblerOptions(assemblerDir));
};

/**
 * Create a production webpack config that also emits a stats.json file.
 * Run via: WEBPACK_STATS=true npm run build
 *
 * @param {string} assemblerDir - Absolute path to the assembler package root
 * @returns {Object} Webpack config
 */
const createDefaultWebpackStats = (assemblerDir) => {
  const config = createDefaultWebpackProd(assemblerDir);
  const distDir = path.resolve(assemblerDir, process.env.ODH_DIST_DIR || 'public');

  return {
    ...config,
    profile: true,
    stats: {
      preset: 'verbose',
      modulesSort: 'size',
      chunksSort: 'size',
      assetsSort: 'size',
    },
    plugins: [
      ...(config.plugins || []),
      {
        apply(compiler) {
          compiler.hooks.done.tapAsync('StatsWriterPlugin', (stats, callback) => {
            const json = stats.toJson({ source: false });
            const outPath = path.join(distDir, '..', 'stats.json');
            require('fs').writeFileSync(outPath, JSON.stringify(json, null, 2));
            console.info(`\nBundle stats written to ${outPath}\n`);
            callback();
          });
        },
      },
    ],
  };
};

module.exports = { createDefaultWebpackDev, createDefaultWebpackProd, createDefaultWebpackStats };
