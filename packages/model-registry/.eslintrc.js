const { merge } = require('@odh-dashboard/eslint-config/utils');
const { tierRestrictions } = require('@odh-dashboard/eslint-config/tier-restrictions');

module.exports = merge(
  require('@odh-dashboard/eslint-config')
    .extend({
      ignorePatterns: ['upstream/**/*', 'upstream'],
    })
    .recommendedReactTypescript(__dirname),
  tierRestrictions('model-registry'),
);
