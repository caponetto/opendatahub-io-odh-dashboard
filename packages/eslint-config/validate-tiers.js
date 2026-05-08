/**
 * Validate the monorepo tiered architecture:
 *
 *  1. Every package has a "topology" field with a valid "tier" value.
 *  2. Packages do not depend on same-tier or higher-tier packages
 *     (extensions enforce strict independence; lower tiers only block higher).
 *  3. test-mocks and jest-config appear only in devDependencies (never in
 *     dependencies or optionalDependencies).
 *  4. No production source file imports @odh-dashboard/test-mocks
 *     (only __tests__/, __mocks__/, *.spec.*, *.test.*, *.cy.* are allowed).
 *
 * Usage:  node packages/eslint-config/validate-tiers.js
 */

const fs = require('node:fs');
const path = require('node:path');

const PACKAGES_DIR = path.resolve(__dirname, '..');
const TIER_LEVELS = {
  infrastructure: 0,
  shared: 1,
  shell: 2,
  extension: 3,
  assembler: 4,
};
const VALID_TIERS = new Set(Object.keys(TIER_LEVELS));

// The cypress package is a test meta-framework that legitimately references all tiers
const EXEMPT_FROM_TIER_CHECK = new Set(['cypress']);

let errors = 0;

const packageMeta = new Map();

// --- Pass 1: collect topology metadata ---
for (const entry of fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const pkgPath = path.join(PACKAGES_DIR, entry.name, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const eslintrcPath = path.join(PACKAGES_DIR, entry.name, '.eslintrc.js');
  const hasTierCall =
    fs.existsSync(eslintrcPath) &&
    fs.readFileSync(eslintrcPath, 'utf8').includes('tierRestrictions(');

  packageMeta.set(entry.name, {
    pkg,
    hasTierCall,
    topology: pkg.topology || null,
    dirName: entry.name,
  });
}

// Build tier lookup: dirName -> tier number
const packageTiers = new Map();

for (const [dirName, meta] of packageMeta) {
  if (meta.topology?.tier && TIER_LEVELS[meta.topology.tier] != null) {
    packageTiers.set(dirName, TIER_LEVELS[meta.topology.tier]);
  }
}

// --- Pass 2: validate topology ---
for (const [dirName, meta] of packageMeta) {
  const { topology } = meta;

  if (!topology) {
    console.error(
      `ERROR: ${dirName} is missing "topology" field in package.json ` +
        `(add "topology": { "tier": "${[...VALID_TIERS].join('|')}" })`,
    );
    errors++;
    continue;
  }

  if (!topology.tier) {
    console.error(`ERROR: ${dirName} has topology but missing topology.tier`);
    errors++;
  } else if (!VALID_TIERS.has(topology.tier)) {
    console.error(
      `ERROR: ${dirName} has invalid topology.tier: "${topology.tier}" (expected ${[
        ...VALID_TIERS,
      ].join(', ')})`,
    );
    errors++;
  }
}

// --- Pass 2b: validate ESLint tier wiring ---
//
// Packages should have tierRestrictions() in their .eslintrc.js unless they are
// assemblers, explicitly exempt via topology.eslintTierExempt, or in the
// EXEMPT_FROM_TIER_CHECK set. This catches packages that silently lack import-
// level tier enforcement.
for (const [dirName, meta] of packageMeta) {
  const { topology, hasTierCall } = meta;
  if (!topology?.tier) {
    continue;
  }
  if (topology.tier === 'assembler') {
    continue;
  }
  if (topology.eslintTierExempt) {
    continue;
  }
  if (EXEMPT_FROM_TIER_CHECK.has(dirName)) {
    continue;
  }
  if (!hasTierCall) {
    console.error(
      `ERROR: ${dirName} (tier "${topology.tier}") is missing tierRestrictions() in .eslintrc.js. ` +
        'Either add tierRestrictions() or set "topology": { "eslintTierExempt": true } in package.json.',
    );
    errors++;
  }
}

// --- Pass 3: validate tier dependency isolation ---
//
// Rules checked at package.json level:
//   - Extension (tier 3): must not depend on other extensions or assemblers (same + higher)
//   - Shell (tier 2), Shared (tier 1), Infrastructure (tier 0): must not depend on higher-tier packages
//   - Assembler (tier 4): exempt -- may depend on anything
//
// devDependencies on build/test tooling packages are excluded since they never produce
// runtime imports (the ESLint tierRestrictions rule handles import-level enforcement).
const TOOLING_PACKAGES = new Set([
  'eslint-config',
  'eslint-plugin',
  'tsconfig',
  'jest-config',
  'test-mocks',
]);

function checkDepsForViolations(depObj, dirName, sourceTier, label) {
  if (!depObj) {
    return;
  }
  const isDevDeps = label.includes('devDependencies');

  for (const dep of Object.keys(depObj)) {
    if (!dep.startsWith('@odh-dashboard/')) {
      continue;
    }
    const depShort = dep.replace('@odh-dashboard/', '');
    if (depShort === dirName) {
      continue;
    }

    if (isDevDeps && TOOLING_PACKAGES.has(depShort)) {
      continue;
    }

    const depTier = packageTiers.get(depShort);
    if (depTier == null) {
      continue;
    }

    // Extensions: flag same-tier and higher (extension independence)
    // All other tiers: flag only higher-tier deps
    const minForbidden = sourceTier === TIER_LEVELS.extension ? sourceTier : sourceTier + 1;

    if (depTier >= minForbidden) {
      const tierNames = Object.keys(TIER_LEVELS);
      const sourceTierName = tierNames.find((k) => TIER_LEVELS[k] === sourceTier);
      const depTierName = tierNames.find((k) => TIER_LEVELS[k] === depTier);
      console.error(
        `ERROR: ${sourceTierName} "${dirName}" (tier ${sourceTier}) depends on ` +
          `${depTierName} "${depShort}" (tier ${depTier}) in ${label}`,
      );
      errors++;
    }
  }
}

for (const [dirName, tier] of packageTiers) {
  if (tier === TIER_LEVELS.assembler || EXEMPT_FROM_TIER_CHECK.has(dirName)) {
    continue;
  }

  const pkgPath = path.join(PACKAGES_DIR, dirName, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  checkDepsForViolations(pkg.dependencies, dirName, tier, 'package.json');
  checkDepsForViolations(pkg.devDependencies, dirName, tier, 'package.json devDependencies');

  const frontendPkgPath = path.join(PACKAGES_DIR, dirName, 'frontend', 'package.json');
  if (fs.existsSync(frontendPkgPath)) {
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    checkDepsForViolations(frontendPkg.dependencies, dirName, tier, 'frontend/package.json');
    checkDepsForViolations(
      frontendPkg.devDependencies,
      dirName,
      tier,
      'frontend/package.json devDependencies',
    );
  }
}

// --- Pass 4: test-only packages must be in devDependencies ---
const TEST_ONLY_PKGS = ['test-mocks', 'jest-config'];

for (const [dirName, meta] of packageMeta) {
  const { pkg } = meta;

  for (const testPkg of TEST_ONLY_PKGS) {
    const scoped = `@odh-dashboard/${testPkg}`;
    if (dirName === testPkg) {
      continue;
    }

    if (pkg.dependencies?.[scoped]) {
      console.error(`ERROR: "${dirName}" has ${scoped} in dependencies (must be devDependencies)`);
      errors++;
    }
    if (pkg.optionalDependencies?.[scoped]) {
      console.error(
        `ERROR: "${dirName}" has ${scoped} in optionalDependencies (must be devDependencies)`,
      );
      errors++;
    }
  }

  // Also check frontend/package.json
  const frontendPkgPath = path.join(PACKAGES_DIR, dirName, 'frontend', 'package.json');
  if (fs.existsSync(frontendPkgPath)) {
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    for (const testPkg of TEST_ONLY_PKGS) {
      const scoped = `@odh-dashboard/${testPkg}`;
      if (frontendPkg.dependencies?.[scoped]) {
        console.error(
          `ERROR: "${dirName}/frontend" has ${scoped} in dependencies (must be devDependencies)`,
        );
        errors++;
      }
      if (frontendPkg.optionalDependencies?.[scoped]) {
        console.error(
          `ERROR: "${dirName}/frontend" has ${scoped} in optionalDependencies (must be devDependencies)`,
        );
        errors++;
      }
    }
  }
}

// --- Pass 5: test-mocks imports only in test files ---
const TEST_FILE_PATTERNS = [
  /__tests__[/\\]/,
  /__mocks__[/\\]/,
  /\.spec\.[jt]sx?$/,
  /\.test\.[jt]sx?$/,
  /\.cy\.[jt]sx?$/,
];

function isTestFile(filePath) {
  return TEST_FILE_PATTERNS.some((re) => re.test(filePath));
}

function scanDirForTestMockImports(dir, pkgLabel) {
  if (!fs.existsSync(dir)) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') {
        continue;
      }
      scanDirForTestMockImports(fullPath, pkgLabel);
    } else if (/\.[jt]sx?$/.test(entry.name) && !isTestFile(fullPath)) {
      const contents = fs.readFileSync(fullPath, 'utf8');
      if (/from\s+['"]@odh-dashboard\/test-mocks/.test(contents)) {
        const relPath = path.relative(PACKAGES_DIR, fullPath);
        console.error(
          `ERROR: production file "${relPath}" imports @odh-dashboard/test-mocks ` +
            '(only test files may import test-mocks)',
        );
        errors++;
      }
    }
  }
}

for (const [dirName] of packageMeta) {
  if (dirName === 'test-mocks' || dirName === 'cypress') {
    continue;
  }
  const pkgDir = path.join(PACKAGES_DIR, dirName);
  scanDirForTestMockImports(path.join(pkgDir, 'src'), dirName);
  scanDirForTestMockImports(path.join(pkgDir, 'extensions'), dirName);

  // Also scan frontend/src if it exists
  const frontendSrc = path.join(pkgDir, 'frontend', 'src');
  if (fs.existsSync(frontendSrc)) {
    scanDirForTestMockImports(frontendSrc, `${dirName}/frontend`);
  }
}

// --- Summary ---
if (errors > 0) {
  throw new Error(`${errors} architecture violation(s) found.`);
} else {
  console.log('\nAll topology metadata is valid. No architecture violations.');
}
