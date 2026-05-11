/**
 * Stage compiled backend files for the production Docker image.
 *
 * Reads the plugin manifest to find extension packages with routes,
 * then copies their compiled dist/backend/ directories (plus package.json
 * for Node.js export resolution) into a known staging directory.
 *
 * Also stages dashboard-foundation-backend (used by all route code) and
 * dashboard-build (used by discoverPluginRoutes at startup).
 *
 * Usage:
 *   node scripts/stage-production-backend.js [--out <dir>]
 *
 * Default output: .production-backend/
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'packages/dashboard-build/.plugin-manifest.json');
const DEFAULT_OUT = path.join(REPO_ROOT, '.production-backend');
const { resolveSelectedPackages } = require('../packages/dashboard-build/resolveSelectedPackages');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function stagePackage(pkgPath, outBase, { distOnly = false } = {}) {
  const rel = path.relative(REPO_ROOT, pkgPath);
  const destBase = path.join(outBase, rel);

  fs.mkdirSync(destBase, { recursive: true });
  fs.copyFileSync(path.join(pkgPath, 'package.json'), path.join(destBase, 'package.json'));

  const distPath = distOnly ? path.join(pkgPath, 'dist', 'backend') : path.join(pkgPath, 'dist');
  const destDist = distOnly ? path.join(destBase, 'dist', 'backend') : path.join(destBase, 'dist');

  if (fs.existsSync(distPath)) {
    copyDir(distPath, destDist);
  } else if (distOnly) {
    throw new Error(
      `Compiled backend missing for ${rel}: ${distPath}\n` +
        'Run `npm run build:backend` before staging.',
    );
  } else {
    console.warn(`  Warning: ${distPath} not found — skipping`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outDir = outIdx >= 0 && args[outIdx + 1] ? path.resolve(args[outIdx + 1]) : DEFAULT_OUT;

  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Plugin manifest not found at ${MANIFEST_PATH}\nRun \`npm run build\` first to generate it.`,
    );
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  // Note: dashboard-shell-backend is NOT staged here — it is COPY'd directly
  // in the Dockerfile. Avoid staging it to prevent duplicate package.json files
  // that would silently overwrite each other in the runtime image layers.

  // Stage dashboard-foundation-backend (dist/ with rewritten exports)
  const foundationPkg = manifest.packages.find(
    (p) => p.name === '@odh-dashboard/dashboard-foundation-backend',
  );
  if (foundationPkg) {
    stagePackage(foundationPkg.path, outDir);
    console.log('  Staged: dashboard-foundation-backend');
  }

  // Stage dashboard-config (compiled dist/ with rewritten exports)
  const configPkg = manifest.packages.find((p) => p.name === '@odh-dashboard/dashboard-config');
  if (configPkg) {
    stagePackage(configPkg.path, outDir);
    console.log('  Staged: dashboard-config');
  }

  // Stage dashboard-build — only the runtime-needed files, NOT the full package.
  // This list is intentionally explicit to avoid pulling build-time code (webpack
  // configs, manifest generators, etc.) into the production image. Update this
  // list if new runtime exports are added to dashboard-build.
  const buildPkg = manifest.packages.find((p) => p.name === '@odh-dashboard/dashboard-build');
  if (buildPkg) {
    const rel = path.relative(REPO_ROOT, buildPkg.path);
    const destBase = path.join(outDir, rel);
    fs.mkdirSync(destBase, { recursive: true });

    const filesToCopy = [
      'package.json',
      'loadManifest.js',
      'loadManifest.d.ts',
      'resolveSelectedPackages.js',
      'resolveSelectedPackages.d.ts',
      '.plugin-manifest.json',
    ];
    for (const file of filesToCopy) {
      const src = path.join(buildPkg.path, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(destBase, file));
      }
    }
    console.log('  Staged: dashboard-build');
  }

  // Stage only assembler-selected extension packages with compiled backend routes.
  // resolveSelectedPackages returns all selected packages (including non-route ones),
  // so we intersect with the set of packages that actually declare routes.
  const assemblerDir =
    process.env.ASSEMBLER_DIR || path.join(REPO_ROOT, 'packages/dashboard-dist-full');
  const allRoutePackages = manifest.packages.filter((p) => p.routesExport);
  const allRouteNames = allRoutePackages.map((p) => p.name);
  const allAvailableNames = manifest.packages.map((p) => p.name);
  const assemblerSelected = new Set(resolveSelectedPackages(allAvailableNames, assemblerDir));
  const selectedNames = new Set(allRouteNames.filter((n) => assemblerSelected.has(n)));

  for (const pkg of allRoutePackages) {
    if (selectedNames.has(pkg.name)) {
      stagePackage(pkg.path, outDir, { distOnly: true });
      console.log(`  Staged: ${pkg.name}`);
    }
  }

  const skipped = allRouteNames.length - selectedNames.size;
  if (skipped > 0) {
    console.log(`  Skipped ${skipped} route package(s) not selected by assembler`);
  }

  console.log(`\nProduction backend staged to ${outDir}`);
}

main();
