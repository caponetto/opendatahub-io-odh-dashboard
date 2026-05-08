const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const MANIFEST_FILENAME = '.plugin-manifest.json';
const MANIFEST_PATH = path.join(__dirname, MANIFEST_FILENAME);

let cachedManifestPackages = null;
let cachedWorkspacePackages = null;

/**
 * Load the build-time plugin manifest from the canonical location
 * (dashboard-build/.plugin-manifest.json).
 *
 * @returns {Array|null} Manifest packages array or null if unavailable
 */
function loadManifest() {
  if (cachedManifestPackages) {
    return cachedManifestPackages;
  }
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      const pkgs = manifest.packages;
      if (Array.isArray(pkgs) && pkgs.length > 0) {
        cachedManifestPackages = pkgs;
        return cachedManifestPackages;
      }
    }
  } catch {
    // corrupt manifest — fall through
  }
  return null;
}

/**
 * Get all workspace packages, preferring the manifest over npm query.
 *
 * @returns {Array} Array of workspace package objects
 */
function getWorkspacePackages() {
  if (cachedWorkspacePackages) {
    return cachedWorkspacePackages;
  }

  const manifestPackages = loadManifest();
  if (manifestPackages) {
    cachedWorkspacePackages = manifestPackages;
    return cachedWorkspacePackages;
  }

  console.warn(
    'Plugin manifest not found — falling back to npm query (slower). ' +
      'Run `node packages/dashboard-build/generatePluginManifest.js` to generate the manifest.',
  );
  try {
    const stdout = execSync('npm query .workspace --json', { encoding: 'utf8' });
    cachedWorkspacePackages = JSON.parse(stdout);
    return cachedWorkspacePackages;
  } catch (error) {
    console.warn('Error querying workspaces:', error.message);
    cachedWorkspacePackages = [];
    return cachedWorkspacePackages;
  }
}

/**
 * Reset cached data. Useful for testing.
 */
function resetCache() {
  cachedManifestPackages = null;
  cachedWorkspacePackages = null;
}

module.exports = {
  loadManifest,
  getWorkspacePackages,
  resetCache,
  MANIFEST_FILENAME,
  MANIFEST_PATH,
};
