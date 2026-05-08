const path = require('path');
const base = require('./base');
const react = require('./react');
const typescript = require('./typescript');
const markdown = require('./markdown');
const node = require('./node');
const yaml = require('./yaml');
const prettier = require('./prettier');

const { merge } = require('./utils');

const addNoExtraneousDependenciesRule = (config, dirname) => {
  const clone = structuredClone(config);
  clone.rules = {
    ...clone.rules,
    'import/no-extraneous-dependencies': [
      'error',
      {
        packageDir: [dirname],
      },
    ],
  };
  clone.overrides = [
    ...(clone.overrides || []),
    {
      files: ['**/*.md/*.js', '**/*.md/*.jsx', '**/*.md/*.ts', '**/*.md/*.tsx'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ];
  clone.root = true;
  return clone;
};

// TODO: enable yaml once formatting is updated with prettier
const recommended = {
  recommendedCore: (dirname) =>
    addNoExtraneousDependenciesRule(
      {
        root: true,
        extends: [
          '@odh-dashboard/eslint-config/base',
          '@odh-dashboard/eslint-config/node',
          '@odh-dashboard/eslint-config/package-restrictions',
          '@odh-dashboard/eslint-config/markdown',
          // '@odh-dashboard/eslint-config/yaml',
          '@odh-dashboard/eslint-config/prettier',
        ],
      },
      dirname,
    ),
  recommendedTypescript: (dirname) =>
    addNoExtraneousDependenciesRule(
      {
        root: true,
        extends: [
          '@odh-dashboard/eslint-config/base',
          '@odh-dashboard/eslint-config/node',
          '@odh-dashboard/eslint-config/package-restrictions',
          '@odh-dashboard/eslint-config/typescript',
          '@odh-dashboard/eslint-config/markdown',
          // '@odh-dashboard/eslint-config/yaml',
          '@odh-dashboard/eslint-config/prettier',
        ],
      },
      dirname,
    ),
  recommendedReactTypescript: (dirname) =>
    addNoExtraneousDependenciesRule(
      {
        root: true,
        extends: [
          '@odh-dashboard/eslint-config/base',
          '@odh-dashboard/eslint-config/node',
          '@odh-dashboard/eslint-config/react',
          '@odh-dashboard/eslint-config/package-restrictions',
          '@odh-dashboard/eslint-config/typescript',
          '@odh-dashboard/eslint-config/markdown',
          // '@odh-dashboard/eslint-config/yaml',
          '@odh-dashboard/eslint-config/prettier',
        ],
      },
      dirname,
    ),
};

const extend = (config) =>
  Object.keys(recommended).reduce((acc, key) => {
    acc[key] = (dirname) => merge(recommended[key](dirname), config);
    return acc;
  }, {});

/**
 * Create a complete ESLint config for an assembler package.
 * Auto-detects the package name from the directory and applies tier restrictions.
 *
 * @param {string} dirname - __dirname of the assembler's .eslintrc.js
 * @returns {Object} ESLint config
 */
const recommendedAssembler = (dirname) => {
  const { tierRestrictions } = require('./tier-restrictions');
  const packageName = path.basename(dirname);
  return merge(recommended.recommendedTypescript(dirname), tierRestrictions(packageName));
};

module.exports = {
  ...recommended,
  recommendedAssembler,
  extend,

  // core configs
  base,

  // add ons: include one or more
  react,
  typescript,
  markdown,
  node,
  yaml,

  // always include prettier
  prettier,

  // utils
  addNoExtraneousDependenciesRule,

  // tier enforcement
  tierRestrictions: require('./tier-restrictions').tierRestrictions,

  // API narrowing (patterns consumed by tierRestrictions)
  getDeepImportPatterns: require('./deep-import-restrictions').getDeepImportPatterns,
};
