const { merge } = require('@odh-dashboard/eslint-config/utils');
const { tierRestrictions } = require('@odh-dashboard/eslint-config/tier-restrictions');
const config = require('@odh-dashboard/eslint-config').recommendedTypescript(__dirname);

module.exports = merge(merge(config, tierRestrictions('dashboard-shell-backend')), {
  overrides: [
    {
      files: ['**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'prefer-destructuring': 'off',
        camelcase: 'off',
        'import/order': 'off',
      },
    },
  ],
});
