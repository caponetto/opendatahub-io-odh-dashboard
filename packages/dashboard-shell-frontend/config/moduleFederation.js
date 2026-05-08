/**
 * Module Federation configuration utilities for the app shell.
 * Provides helpers to read MF configs from workspace packages and
 * generate the appropriate webpack shared/remotes config.
 */

const fs = require('fs');
const path = require('path');

/**
 * Reads module-federation config from a package's package.json.
 * @param {string} packageDir - Absolute path to the package directory
 * @returns {Object|null} The module-federation config or null
 */
function readMFConfigFromPackage(packageDir) {
  const pkgJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return null;
  }
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  return pkgJson['module-federation'] || null;
}

/**
 * Discovers all workspace packages that have module-federation configs.
 * @param {string} rootDir - Monorepo root directory
 * @returns {Array<{name: string, dir: string, config: Object}>}
 */
function discoverFederatedPackages(rootDir) {
  const packagesDir = path.join(rootDir, 'packages');
  if (!fs.existsSync(packagesDir)) {
    return [];
  }

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = path.join(packagesDir, d.name);
      const config = readMFConfigFromPackage(dir);
      return config ? { name: config.name, dir, config } : null;
    })
    .filter(Boolean);
}

/**
 * Generates MF remotes config from discovered packages.
 * @param {string} rootDir - Monorepo root directory
 * @param {Object} [options]
 * @param {string[]} [options.include] - Only include these package MF names
 * @param {string[]} [options.exclude] - Exclude these package MF names
 * @returns {Object} Remotes config for ModuleFederationPlugin
 */
function generateRemotesConfig(rootDir, options = {}) {
  const { include, exclude = [] } = options;
  const packages = discoverFederatedPackages(rootDir);

  return packages
    .filter((pkg) => {
      if (include && !include.includes(pkg.name)) {
        return false;
      }
      return !exclude.includes(pkg.name);
    })
    .reduce(
      (acc, pkg) => ({
        ...acc,
        [pkg.name]: `${pkg.name}@/_mf/${pkg.name}${pkg.config.remoteEntry || '/remoteEntry.js'}`,
      }),
      {},
    );
}

/**
 * Generates the shared deps config including all @odh-dashboard/* runtime packages.
 * @param {string} rootDir - Monorepo root
 * @param {Object} hostPackageJson - The host's package.json (to determine versions)
 * @returns {Object} Shared config for ModuleFederationPlugin
 */
function generateSharedConfig() {
  const coreShared = {
    react: { singleton: true, requiredVersion: '*', eager: true },
    'react-dom': { singleton: true, requiredVersion: '*', eager: true },
    'react-router': { singleton: true, requiredVersion: '*', eager: true },
    'react-router-dom': { singleton: true, requiredVersion: '*', eager: true },
    '@patternfly/react-core': { singleton: true, requiredVersion: '*', eager: true },
    '@patternfly/react-code-editor': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/k8s-browser': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/plugin-core': { singleton: true, requiredVersion: '*', eager: true },
    '@odh-dashboard/dashboard-shell-frontend': {
      singleton: true,
      requiredVersion: '*',
      eager: true,
    },
  };

  return coreShared;
}

module.exports = {
  readMFConfigFromPackage,
  discoverFederatedPackages,
  generateRemotesConfig,
  generateSharedConfig,
};
