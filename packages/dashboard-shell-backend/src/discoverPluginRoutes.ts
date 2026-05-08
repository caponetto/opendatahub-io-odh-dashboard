import * as path from 'node:path';
import * as fs from 'node:fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  loadManifest,
  getWorkspacePackages,
} = require('@odh-dashboard/dashboard-build/loadManifest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  resolveSelectedPackages,
} = require('@odh-dashboard/dashboard-build/resolveSelectedPackages');

interface ManifestPackage {
  name: string;
  path: string;
  routesExport?: string;
  exports?: Record<string, string>;
}

function getRoutePackagesFromManifest(packages: ManifestPackage[]): ManifestPackage[] {
  return packages.filter((pkg) => pkg.routesExport);
}

function filterRoutePackages(
  workspaces: Array<{ name: string; path: string; exports?: Record<string, string> }>,
): ManifestPackage[] {
  return workspaces
    .filter((pkg) => pkg.exports?.['./routes'])
    .map((pkg) => ({
      name: pkg.name,
      path: pkg.path,
      routesExport: pkg.exports?.['./routes'],
    }));
}

/**
 * Discover plugin route directories for a backend assembler.
 *
 * Resolution priority (mirrors frontend discoverPluginPackages):
 *   1. PLUGIN_PACKAGES env var (comma-separated)
 *   2. "pluginPackages" field in the assembler's package.json
 *   3. Auto-discover all workspace packages with "./routes" export
 *
 * Data source: reads the build-time plugin manifest when available,
 * falling back to `npm query` only if the manifest is absent.
 *
 * @returns Array of absolute paths to route entry files
 */
export function discoverPluginRoutes(assemblerDir?: string): string[] {
  const manifestPackages = loadManifest();
  const workspacePackages: ManifestPackage[] = manifestPackages ?? getWorkspacePackages();
  const routePackages = manifestPackages
    ? getRoutePackagesFromManifest(manifestPackages)
    : filterRoutePackages(workspacePackages);
  const availableNames = workspacePackages.map((pkg) => pkg.name);

  const selectedNames: string[] = resolveSelectedPackages(availableNames, assemblerDir);

  const routePaths: string[] = [];

  for (const name of selectedNames) {
    const pkg = routePackages.find((p) => p.name === name);
    if (!pkg?.path) {
      continue;
    }

    const { routesExport } = pkg;
    if (!routesExport) {
      continue;
    }

    const routeEntryPath = path.resolve(pkg.path, routesExport);
    if (fs.existsSync(routeEntryPath)) {
      routePaths.push(routeEntryPath);
    } else {
      const tsPath = routeEntryPath.replace(/\.js$/, '.ts');
      if (fs.existsSync(tsPath)) {
        routePaths.push(tsPath);
      }
    }
  }

  if (routePaths.length > 0) {
    console.log(
      'Discovered plugin routes:',
      selectedNames.filter((n) => routePackages.some((p) => p.name === n)),
    );
  }

  return routePaths;
}
