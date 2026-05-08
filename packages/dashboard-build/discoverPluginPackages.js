const { getWorkspacePackages } = require('./loadManifest');
const { resolveSelectedPackages } = require('./resolveSelectedPackages');

const hasExtensionsExport = (pkg) => Boolean(pkg.extensionsExport || pkg.exports?.['./extensions']);

const hasModuleFederation = (pkg) => Boolean(pkg.moduleFederation || pkg['module-federation']);

/**
 * Filter packages that have ./extensions export, excluding assembler-tier packages.
 * Assembler packages (dashboard-dist-full, dashboard-dist-slim, etc.) may declare ./extensions
 * for their own override extensions, but they are not plugin packages and must not
 * be discovered as such by other assemblers.
 * @param {Array} packages - Array of package objects
 * @returns {Array} Array of plugin packages with statically importable extensions
 */
function filterPluginPackages(packages) {
  return packages.filter((pkg) => hasExtensionsExport(pkg) && pkg.topology?.tier !== 'assembler');
}

/**
 * Filter packages that can be selected by an assembler. This includes:
 * - packages with statically importable ./extensions
 * - packages that are available only via Module Federation at runtime
 *
 * @param {Array} packages - Array of package objects
 * @returns {Array} Array of selectable packages
 */
function filterSelectablePackages(packages) {
  return packages.filter(
    (pkg) =>
      (hasExtensionsExport(pkg) || hasModuleFederation(pkg)) && pkg.topology?.tier !== 'assembler',
  );
}

/**
 * Discover plugin packages for an assembler build.
 *
 * Resolution priority:
 *   1. PLUGIN_PACKAGES env var (comma-separated) — highest, for CI/dev override
 *   2. "pluginPackages" field in the assembler's package.json — declarative per-variant config
 *   3. Auto-discover all workspace packages with "./extensions" export (fallback)
 *
 * @param {string} [assemblerDir] - Absolute path to the assembler package root
 * @returns {string[]} An array of package names.
 */
function discoverPluginPackages(assemblerDir) {
  const workspacePackages = getWorkspacePackages();
  const selectablePackages = filterSelectablePackages(workspacePackages);
  const availablePluginNames = selectablePackages.map((pkg) => pkg.name);

  return resolveSelectedPackages(availablePluginNames, assemblerDir, {
    prependPackages: ['@odh-dashboard/dashboard-shell-frontend'],
  });
}

/**
 * Get details of plugin packages for webpack chunk grouping.
 * Returns the short name and filesystem location for each plugin package,
 * excluding the host internal package.
 * @param {string} [assemblerDir] - Absolute path to the assembler package root (filters to pluginPackages)
 * @returns {{ name: string, shortName: string, location: string }[]}
 */
function getPluginPackageDetails(assemblerDir) {
  const discoveredNames = new Set(discoverPluginPackages(assemblerDir));
  const workspacePackages = getWorkspacePackages();
  const pluginPackages = filterPluginPackages(workspacePackages);
  return pluginPackages
    .filter((pkg) => {
      if (pkg.name === '@odh-dashboard/internal') {
        return false;
      }
      if (!discoveredNames.has(pkg.name)) {
        return false;
      }
      if (!pkg.path) {
        console.warn(
          `Plugin package ${pkg.name} has no path from npm query, skipping chunk grouping`,
        );
        return false;
      }
      return true;
    })
    .map((pkg) => ({
      name: pkg.name,
      shortName: pkg.name.replace(/^@[^/]+\//, ''),
      location: pkg.path,
    }));
}

module.exports = {
  discoverPluginPackages,
  getPluginPackageDetails,
};
