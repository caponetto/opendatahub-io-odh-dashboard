/**
 * Generate a plugin manifest JSON file from workspace metadata.
 *
 * This replaces runtime `npm query` calls at server startup with a static
 * build artifact. The manifest captures package names, paths, and relevant
 * export/config fields for both frontend (extensions) and backend (routes).
 *
 * Usage:
 *   node packages/dashboard-build/generatePluginManifest.js [--out <path>]
 *
 * The default output is packages/dashboard-build/.plugin-manifest.json.
 * Assembler build scripts should run this before starting the backend.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DEFAULT_OUTPUT = path.join(__dirname, '.plugin-manifest.json');

function getWorkspacePackages() {
  const stdout = execSync('npm query .workspace --json', { encoding: 'utf8' });
  return JSON.parse(stdout);
}

function generateManifest() {
  const packages = getWorkspacePackages();
  const manifest = {
    generatedAt: new Date().toISOString(),
    packages: packages
      .filter((pkg) => pkg.name?.startsWith('@odh-dashboard/'))
      .map((pkg) => {
        const entry = {
          name: pkg.name,
          path: pkg.path,
        };
        if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
          entry.dependencies = pkg.dependencies;
        }
        if (pkg.exports?.['./extensions']) {
          entry.extensionsExport = pkg.exports['./extensions'];
        }
        if (pkg.exports?.['./routes']) {
          entry.routesExport = pkg.exports['./routes'];
          const tsconfigPath = path.join(pkg.path, 'tsconfig.backend.json');
          if (fs.existsSync(tsconfigPath)) {
            let tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
            // Only resolves one level of extends — sufficient for the current
            // convention where extensions extend tsconfig/tsconfig.backend.json
            // directly. Chained extends would need recursive resolution.
            if (!tsconfig.compilerOptions && tsconfig.extends) {
              const basePath = require.resolve(tsconfig.extends, { paths: [pkg.path] });
              tsconfig = JSON.parse(fs.readFileSync(basePath, 'utf8'));
            }
            const { rootDir, outDir } = tsconfig.compilerOptions || {};
            if (rootDir && outDir) {
              const prefix = new RegExp(`^\\./${outDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`);
              if (prefix.test(entry.routesExport)) {
                entry.routesExportDev = entry.routesExport
                  .replace(prefix, `./${rootDir}/`)
                  .replace(/\.js$/, '.ts');
              }
            }
          }
        }
        if (pkg['module-federation']) {
          entry.moduleFederation = pkg['module-federation'];
        }
        if (pkg.topology) {
          entry.topology = pkg.topology;
        }
        return entry;
      }),
  };
  return manifest;
}

function validateRouteExports(manifest) {
  const missing = manifest.packages.filter((pkg) => {
    if (!pkg.routesExport) {
      return false;
    }
    const compiledPath = path.join(pkg.path, pkg.routesExport);
    return !fs.existsSync(compiledPath);
  });
  if (missing.length > 0) {
    console.warn(
      '\nWarning: The following packages declare ./routes but the compiled entry is missing.',
    );
    console.warn('Run `npm run build:backend` to compile extension backends:');
    missing.forEach((pkg) => console.warn(`  - ${pkg.name}: ${pkg.routesExport}`));
    console.warn('');
  }
}

function validateDualPathPackages(manifest) {
  const dualPath = manifest.packages.filter(
    (pkg) => pkg.extensionsExport && pkg.moduleFederation && pkg.moduleFederation.backend,
  );
  if (dualPath.length > 0) {
    console.warn(
      '\nWarning: The following packages declare both ./extensions and module-federation with a backend.',
    );
    console.warn('This creates a risk of duplicate extension loading (static + MF runtime):');
    dualPath.forEach((pkg) => console.warn(`  - ${pkg.name}`));
    console.warn('');
  }
}

function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outputPath =
    outIdx >= 0 && args[outIdx + 1] ? path.resolve(args[outIdx + 1]) : DEFAULT_OUTPUT;

  const manifest = generateManifest();
  validateRouteExports(manifest);
  validateDualPathPackages(manifest);
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Plugin manifest written to ${outputPath} (${manifest.packages.length} packages)`);
}

module.exports = { generateManifest };

if (require.main === module) {
  main();
}
