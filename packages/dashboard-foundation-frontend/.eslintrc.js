const { merge } = require('@odh-dashboard/eslint-config/utils');
const { tierRestrictions } = require('@odh-dashboard/eslint-config/tier-restrictions');
const config = require('@odh-dashboard/eslint-config').recommendedReactTypescript(__dirname);

module.exports = merge(config, tierRestrictions('dashboard-foundation-frontend'));
