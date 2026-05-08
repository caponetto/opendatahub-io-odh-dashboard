const config = require('@odh-dashboard/eslint-config').recommendedReactTypescript(__dirname);

module.exports = {
  ...config,
  ignorePatterns: [...(config.ignorePatterns || []), 'types.js', 'types.d.ts'],
};
