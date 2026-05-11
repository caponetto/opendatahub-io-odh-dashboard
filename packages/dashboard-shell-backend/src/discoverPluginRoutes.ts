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
  routesExportDev?: string;
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
  const isDev = process.env.NODE_ENV === 'development';

  for (const name of selectedNames) {
    const pkg = routePackages.find((p) => p.name === name);
    if (!pkg?.path) {
      continue;
    }

    const { routesExport } = pkg;
    if (!routesExport) {
      continue;
    }
    const exportPath = (isDev && pkg.routesExportDev) || routesExport;
    const routeEntryPath = path.resolve(pkg.path, exportPath);
    if (fs.existsSync(routeEntryPath)) {
      routePaths.push(routeEntryPath);
    } else if (isDev && !pkg.routesExportDev) {
      // No manifest or routesExportDev unavailable — derive TS source from
      // the compiled-JS export path as a best-effort fallback for cold starts.
      const srcPath = routeEntryPath
        .replace(/[\\/]dist[\\/]backend[\\/]/, `${path.sep}src${path.sep}backend${path.sep}`)
        .replace(/\.js$/, '.ts');
      if (fs.existsSync(srcPath)) {
        routePaths.push(srcPath);
      } else {
        console.warn(`Warning: ${name} route entry not found at ${routeEntryPath} or ${srcPath}`);
      }
    } else {
      console.warn(`Warning: ${name} route entry not found: ${routeEntryPath}`);
    }
  }

  if (routePaths.length > 0) {
    console.log(
      'Discovered plugin routes:',
      selectedNames.filter((n) => routePackages.some((p) => p.name === n)),
    );
    if (isDev && routePaths.some((p) => p.endsWith('.js'))) {
      console.warn(
        'Warning: running in development mode but loading compiled .js route files. ' +
          'This usually means --conditions=@dev is not set in NODE_OPTIONS. ' +
          'Source changes may not take effect until the next build:backend run.',
      );
    }
  }

  return routePaths;
}
