const { merge } = require('@odh-dashboard/eslint-config/utils');
const { tierRestrictions } = require('@odh-dashboard/eslint-config/tier-restrictions');

module.exports = merge(
  require('@odh-dashboard/eslint-config').recommendedCore(__dirname),
  tierRestrictions('dashboard-build'),
);
