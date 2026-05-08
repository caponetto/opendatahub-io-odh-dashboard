const { execSync } = require('child_process');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');
const { getRuntimeOdhPackages } = require('./getRuntimeOdhPackages');
const { discoverPluginPackages } = require('./discoverPluginPackages');
const { loadManifest } = require('./loadManifest');

const updateTypes = !!process.env.MF_UPDATE_TYPES;

/**
 * Check if a config is the old format by checking for `remoteEntry` at the top level.
 * @param {Object} config
 * @returns {boolean}
 */
const isOldConfig = (config) => 'remoteEntry' in config;

/**
 * Converts a deprecated old config to the newer format.
 * @param {Object} oldConfig
 * @returns {Object}
 */
const convertModuleFederationConfig = (oldConfig) => {
  const { name, remoteEntry, authorize, local, service, proxy, tls } = oldConfig;

  const normalizedService = {
    name: service.name,
    namespace: service.namespace ?? process.env.OC_PROJECT ?? '',
    port: service.port,
  };

  return {
    name,
    backend: {
      remoteEntry,
      service: normalizedService,
      ...(authorize !== undefined && { authorize }),
      ...(tls !== undefined && { tls }),
      ...(local && {
        localService: {
          host: local.host,
          port: local.port,
        },
      }),
    },
    proxyService: (proxy ?? []).map((p) => ({
      path: p.path,
      ...(p.pathRewrite && { pathRewrite: p.pathRewrite }),
      service: normalizedService,
      ...(authorize !== undefined && { authorize }),
      ...(local && {
        localService: {
          host: local.host,
          port: local.port,
        },
      }),
    })),
  };
};

/**
 * Normalizes a config to the new format, converting from old format if necessary.
 * @param {Object} config
 * @returns {Object}
 */
const normalizeConfig = (config) =>
  isOldConfig(config) ? convertModuleFederationConfig(config) : config;

/**
 * Get all workspace packages via npm query.
 *
 * This MUST use npm query (not the manifest) because consumers like
 * getRuntimeOdhPackages() need the full `dependencies` graph to compute
 * the transitive closure of shared singletons. The manifest may not
 * contain this data in older builds.
 *
 * @returns {Array} Array of workspace package objects with full metadata
 */
const queryWorkspacePackages = () => {
  try {
    const stdout = execSync('npm query .workspace --json', {
      encoding: 'utf8',
    });
    return JSON.parse(stdout);
  } catch (error) {
    console.warn('Error querying workspaces with npm query:', error.message);
    return [];
  }
};

/**
 * Read module federation configs, preferring the manifest over npm query.
 * Each returned config has a `_packageName` property for filtering.
 * @returns {Object[]}
 */
const readModuleFederationConfigFromPackages = () => {
  const manifestPackages = loadManifest();
  if (manifestPackages) {
    const manifestConfigs = manifestPackages
      .filter((pkg) => pkg.moduleFederation)
      .map((pkg) => ({ ...normalizeConfig(pkg.moduleFederation), _packageName: pkg.name }));
    if (manifestConfigs.length > 0) {
      return manifestConfigs;
    }
  }

  const configs = [];
  const workspacePackages = queryWorkspacePackages();

  try {
    for (const pkg of workspacePackages) {
      const federatedConfigProperty = pkg['module-federation'];
      if (federatedConfigProperty) {
        configs.push({ ...normalizeConfig(federatedConfigProperty), _packageName: pkg.name });
      }
    }
  } catch (e) {
    console.error('Failed to process workspace packages for module federation.', e);
  }

  return configs;
};

/**
 * @param {string} [assemblerDir] - Absolute path to the assembler package root (filters to pluginPackages)
 * @returns {Object[]}
 */
const getModuleFederationConfig = (assemblerDir) => {
  let configs;
  if (process.env.MODULE_FEDERATION_CONFIG) {
    try {
      configs = JSON.parse(process.env.MODULE_FEDERATION_CONFIG).map(normalizeConfig);
    } catch (e) {
      console.error('Failed to parse module federation config from ENV', e);
      configs = [];
    }
  } else {
    configs = readModuleFederationConfigFromPackages();
  }

  if (assemblerDir) {
    const discoveredNames = new Set(discoverPluginPackages(assemblerDir));
    /**
     * Fail-open filter: remotes from MODULE_FEDERATION_CONFIG that have no
     * _packageName (not linked to a workspace package) pass through unconditionally.
     * This is intentional — runtime-injected MF configs describe deployed federation
     * targets that are not monorepo workspace packages.
     */
    configs = configs.filter((c) => {
      if (!c._packageName) {
        if (process.env.MF_STRICT_FILTER === 'true') {
          console.error(`MF_STRICT_FILTER: rejecting unmapped remote "${c.name}"`);
          return false;
        }
        console.warn(
          `MF remote "${c.name}" has no workspace package mapping — passing through assembler filter.`,
        );
        return true;
      }
      return discoveredNames.has(c._packageName);
    });
  }

  return configs;
};

/**
 * @param {Object} options
 * @param {Object} options.deps - Dependencies from assembler package.json (react, react-dom, etc.)
 * @param {Object} [options.hostPackageJson] - Host internal package.json for shared @odh-dashboard/* (e.g. assembler src/package.json). If omitted, odhDashboard shared entries are skipped.
 * @param {string} [options.assemblerDir] - Absolute path to assembler root (for filtering MF configs)
 * @returns {import('webpack').WebpackPluginInstance[]}
 */
const createModuleFederationPlugins = ({ deps, hostPackageJson, assemblerDir }) => {
  const workspacePackages = queryWorkspacePackages();
  const mfConfig = getModuleFederationConfig(assemblerDir);

  const odhDashboardShared = hostPackageJson
    ? Object.fromEntries(
        [...getRuntimeOdhPackages(workspacePackages, hostPackageJson)].map((name) => [
          name,
          { singleton: true, requiredVersion: '*', eager: true },
        ]),
      )
    : {};

  if (mfConfig.length === 0) {
    return [];
  }

  return [
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: updateTypes
        ? mfConfig.reduce((acc, config) => {
            if (!config.backend) {
              return acc;
            }
            const { localService, remoteEntry, service } = config.backend;
            const host = localService?.host ?? 'localhost';
            const port = localService?.port ?? service.port;
            acc[`@mf/${config.name}`] = `${config.name}@http://${host}:${port}${remoteEntry}`;
            return acc;
          }, {})
        : undefined,
      shared: {
        react: { singleton: true, requiredVersion: deps.react, eager: true },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
        'react-router': {
          singleton: true,
          requiredVersion: deps['react-router'],
          eager: true,
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: deps['react-router-dom'],
          eager: true,
        },
        '@patternfly/react-code-editor': {
          singleton: true,
          requiredVersion: deps['@patternfly/react-code-editor'],
        },
        '@patternfly/react-core': {
          singleton: true,
          requiredVersion: deps['@patternfly/react-core'],
        },
        ...odhDashboardShared,
      },
      exposes: {},
      dts: updateTypes,
    }),
  ];
};

module.exports = {
  isOldConfig,
  convertModuleFederationConfig,
  normalizeConfig,
  queryWorkspacePackages,
  readModuleFederationConfigFromPackages,
  getModuleFederationConfig,
  createModuleFederationPlugins,
};
