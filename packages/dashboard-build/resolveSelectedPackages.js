const path = require('path');
const fs = require('fs');

/**
 * Validate a list of package names against available packages.
 * Throws if any requested package is not found.
 *
 * @param {string[]} wantedNames - Requested package names
 * @param {string[]} availableNames - All available package names
 * @param {string} source - Description of the source for error messages
 * @returns {string[]} Validated package names
 */
function validatePackageList(wantedNames, availableNames, source) {
  const available = new Set(availableNames);
  const valid = [];
  const invalid = [];

  for (const name of wantedNames) {
    if (available.has(name)) {
      valid.push(name);
    } else {
      invalid.push(name);
    }
  }

  if (invalid.length > 0) {
    const invalidList = invalid.map((pkg) => `  - ${pkg}`).join('\n');
    const availableList = availableNames.map((pkg) => `  - ${pkg}`).join('\n');
    throw new Error(
      `Invalid packages specified in ${source}:\n${invalidList}\n\nAvailable:\n${availableList}`,
    );
  }

  return valid;
}

/**
 * Resolve the set of selected package names using the standard precedence:
 *   1. PLUGIN_PACKAGES env var (comma-separated) — highest override
 *   2. assembler's package.json "pluginPackages" field
 *   3. all available names (fallback)
 *
 * @param {string[]} availableNames - All available package names for this surface
 * @param {string} [assemblerDir] - Absolute path to the assembler package root
 * @param {Object} [options]
 * @param {string[]} [options.prependPackages] - Packages to auto-prepend if not already listed (e.g. dashboard-shell-frontend for extensions)
 * @returns {string[]} Selected package names
 */
function resolveSelectedPackages(availableNames, assemblerDir, options) {
  const prependPackages = options?.prependPackages;

  if (process.env.PLUGIN_PACKAGES) {
    const wanted = process.env.PLUGIN_PACKAGES.split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    return validatePackageList(wanted, availableNames, 'PLUGIN_PACKAGES');
  }

  if (assemblerDir) {
    const pkgPath = path.join(assemblerDir, 'package.json');
    try {
      const content = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(content);

      if (pkg.pluginPackages === 'all') {
        return [...availableNames];
      }

      if (Array.isArray(pkg.pluginPackages)) {
        let requested = [...pkg.pluginPackages];
        if (prependPackages) {
          for (const name of [...prependPackages].reverse()) {
            if (!requested.includes(name)) {
              requested.unshift(name);
            }
          }
        }
        return validatePackageList(
          requested,
          availableNames,
          `${pkg.name || pkgPath} "pluginPackages"`,
        );
      }
    } catch (e) {
      if (e instanceof SyntaxError || (e && e.code === 'ENOENT')) {
        // corrupt or missing package.json — fall through
      } else {
        throw e;
      }
    }
  }

  return [...availableNames];
}

module.exports = { resolveSelectedPackages, validatePackageList };
