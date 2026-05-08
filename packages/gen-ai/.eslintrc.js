const { merge } = require('@odh-dashboard/eslint-config/utils');
const { tierRestrictions } = require('@odh-dashboard/eslint-config/tier-restrictions');

module.exports = merge(
  require('@odh-dashboard/eslint-config')
    .extend({
      ignorePatterns: ['frontend'],
    })
    .recommendedReactTypescript(__dirname),
  tierRestrictions('gen-ai'),
);
