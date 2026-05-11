/**
 * Reduces the root package.json to a production-only workspace manifest.
 *
 * npm prune --omit=dev does not correctly handle npm workspaces — it only
 * removes root-level devDependencies while leaving all workspace devDependencies
 * hoisted in node_modules/. This script replaces the root package.json with a
 * minimal manifest so that a subsequent `npm install --omit=dev` re-installs
 * only runtime-relevant packages.
 *
 * Runtime workspaces are resolved dynamically from the build-time plugin
 * manifest + the assembler's pluginPackages config. Transitive workspace
 * dependencies (shared / infrastructure packages) are included automatically.
 *
 * Fields preserved:
 *   - name, private          — required by npm
 *   - workspaces             — narrowed to runtime-only workspaces
 *   - dependencies           — root runtime deps (some are shared with backend)
 *   - overrides              — CRITICAL: npm ignores overrides declared in
 *                              workspace packages, so these root overrides are
 *                              the sole mechanism that pins transitive deps to
 *                              their CVE-remediated versions
 *   - engines, packageManager — keep consistency with CI expectations
 */

const fs = require('node:fs');
const path = require('node:path');

const MANIFEST_PATH = path.join(__dirname, '../packages/dashboard-build/.plugin-manifest.json');
const { resolveSelectedPackages } = require('../packages/dashboard-build/resolveSelectedPackages');

const CORE_PACKAGES = new Set([
  '@odh-dashboard/dashboard-shell-backend',
  '@odh-dashboard/dashboard-config',
  '@odh-dashboard/dashboard-build',
  '@odh-dashboard/dashboard-foundation-backend',
]);

function resolveSelectedRouteNames(manifest) {
  const assemblerDir =
    process.env.ASSEMBLER_DIR || path.join(process.cwd(), 'packages/dashboard-dist-full');
  const routeNames = new Set(manifest.packages.filter((p) => p.routesExport).map((p) => p.name));
  const allNames = manifest.packages.map((p) => p.name);
  const selected = resolveSelectedPackages(allNames, assemblerDir);
  return selected.filter((n) => routeNames.has(n));
}

function addTransitiveDeps(runtimeNames, nameToPackage) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of runtimeNames) {
      const pkg = nameToPackage.get(name);
      if (!pkg?.dependencies) {
        continue;
      }
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith('@odh-dashboard/') && nameToPackage.has(dep) && !runtimeNames.has(dep)) {
          runtimeNames.add(dep);
          changed = true;
        }
      }
    }
  }
}

function resolveRuntimeWorkspaces(manifest) {
  const nameToPackage = new Map(manifest.packages.map((p) => [p.name, p]));
  const selectedRouteNames = resolveSelectedRouteNames(manifest);
  const runtimeNames = new Set([...CORE_PACKAGES, ...selectedRouteNames]);

  addTransitiveDeps(runtimeNames, nameToPackage);

  return {
    runtimeNames,
    nameToPackage,
    workspacePaths: [...runtimeNames]
      .map((name) => {
        const pkg = nameToPackage.get(name);
        return pkg ? path.relative(process.cwd(), pkg.path) : null;
      })
      .filter(Boolean)
      .toSorted((a, b) => a.localeCompare(b)),
  };
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Plugin manifest not found at ${MANIFEST_PATH}\nRun \`npm run build\` first to generate it.`,
    );
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const { workspacePaths } = resolveRuntimeWorkspaces(manifest);

  const root = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const reduced = {
    name: root.name,
    private: true,
    workspaces: workspacePaths,
    dependencies: root.dependencies,
    overrides: root.overrides,
    engines: root.engines,
    packageManager: root.packageManager,
  };

  for (const k of Object.keys(reduced)) {
    if (reduced[k] == null) {
      delete reduced[k];
    }
  }

  fs.writeFileSync('package.json', `${JSON.stringify(reduced, null, 2)}\n`);

  console.log('Reduced package.json to runtime-only manifest');
  console.log('  workspaces:', workspacePaths);
  console.log('  dependencies:', Object.keys(reduced.dependencies || {}));
  console.log('  overrides:', Object.keys(reduced.overrides || {}));
}

main();
