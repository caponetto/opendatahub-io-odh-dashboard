/**
 * Package tier classification for dependency enforcement.
 *
 * Each package declares its tier in package.json under the "topology" key:
 *
 *   "topology": { "tier": "extension" }
 *
 * Tiers:
 *   "infrastructure" (0) — shared libs consumed by all (foundation, plugin-core, backend-utils, config, tooling)
 *   "shared"         (1) — domain-specific shared packages consumed by extensions (*-shared packages)
 *   "shell"          (2) — app shell and server framework (dashboard-shell-frontend, dashboard-shell-backend)
 *   "extension"      (3) — independent features that MUST NOT import each other
 *   "assembler"      (4) — compose extensions into a runnable application
 *
 * Rules:
 *   - Extensions must not import other extensions or higher tiers (strict independence).
 *   - Non-extensions may import same-tier packages but not higher tiers.
 *   - Assemblers are exempt (may depend on anything).
 *   - Type-only imports (`import type`) across tiers are always allowed
 *     since they create no runtime dependency (erased by TypeScript).
 */

const fs = require('node:fs');
const path = require('node:path');
const { getDeepImportPatterns } = require('./deep-import-restrictions');

const PACKAGES_DIR = path.resolve(__dirname, '..'); // packages/eslint-config -> packages/

const TIER_LEVELS = {
  infrastructure: 0,
  shared: 1,
  shell: 2,
  extension: 3,
  assembler: 4,
};

let _cache = null;

/**
 * Scan every direct child of `packages/` for a package.json with a "topology"
 * field and build the tier map + assembler set.
 *
 * Results are cached for the lifetime of the ESLint process.
 */
function discoverPackages() {
  if (_cache) {
    return _cache;
  }

  const tiers = {};
  const tierMembers = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  const assemblers = new Set();

  for (const entry of fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const pkgPath = path.join(PACKAGES_DIR, entry.name, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      continue;
    }

    const { topology } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!topology?.tier) {
      continue;
    }

    const tierNum = TIER_LEVELS[topology.tier];
    if (tierNum == null) {
      continue;
    }

    tiers[entry.name] = tierNum;
    if (tierMembers[tierNum]) {
      tierMembers[tierNum].push(entry.name);
    }
    if (topology.tier === 'assembler') {
      assemblers.add(entry.name);
    }
  }

  _cache = { tiers, tierMembers, assemblers };
  return _cache;
}

/**
 * Build `@odh-dashboard/no-restricted-imports` patterns for a package.
 *
 * @param {string} packageName — the unscoped package name (e.g. "pipelines")
 * @returns ESLint rule config fragment: `{ rules: { ... } }`
 */
const tierRestrictions = (packageName) => {
  const { tiers, tierMembers } = discoverPackages();

  const tier = tiers[packageName];
  if (tier == null) {
    throw new Error(
      `Package "${packageName}" has no "topology" field in its package.json (or is missing from packages/). ` +
        'Add "topology": { "tier": "infrastructure|shared|shell|extension|assembler" } to the package.json.',
    );
  }

  const patterns = [];

  // --- Tier restriction ---
  // Extensions block same-tier + higher (extensions must be independent).
  // Non-extensions block higher-tier only (same-tier deps are allowed).
  // Assembler is exempt (may depend on anything).
  const forbidden = [];

  if (tier < TIER_LEVELS.assembler) {
    const minForbidden = tier === TIER_LEVELS.extension ? tier : tier + 1;
    for (let t = minForbidden; t <= TIER_LEVELS.assembler; t++) {
      (tierMembers[t] || []).forEach((p) => {
        if (p !== packageName) {
          forbidden.push(p);
        }
      });
    }
  }

  const tierGroup = forbidden.map((p) => `@odh-dashboard/${p}/**`);

  if (tierGroup.length > 0) {
    const sameOrHigher =
      tier === TIER_LEVELS.extension ? 'same-tier or higher-tier' : 'higher-tier';
    patterns.push({
      group: tierGroup,
      allowTypeImports: true,
      message:
        `Tier ${tier} package "${packageName}" must not import from ${sameOrHigher} packages. ` +
        'Move shared code to a lower tier or use extension points. (Type-only imports are allowed.)',
    });
  }

  // --- Deep-import restrictions ---
  // Append barrel-bypass patterns so consumers use barrel entry points
  // instead of reaching into submodules.
  patterns.push(...getDeepImportPatterns());

  if (patterns.length === 0) {
    return {};
  }

  return {
    rules: {
      '@odh-dashboard/no-restricted-imports': [
        'error',
        {
          patterns,
        },
      ],
    },
  };
};

module.exports = { tierRestrictions, discoverPackages };
