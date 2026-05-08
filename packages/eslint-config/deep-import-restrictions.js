/**
 * Deep-import restriction patterns for narrowing public APIs.
 *
 * These patterns block imports that bypass intended barrel entry points.
 * They are consumed by tierRestrictions() which appends them to the
 * @odh-dashboard/no-restricted-imports rule at 'error' severity.
 *
 * Pattern convention:
 *   group: ['@odh-dashboard/dashboard-foundation-frontend/<area>/<deep>/<path>']
 *   message: 'Import from @odh-dashboard/dashboard-foundation-frontend/<area> instead.'
 *
 * To add a new restriction:
 *   1. Create the barrel file at packages/dashboard-foundation-frontend/src/<area>/index.ts
 *   2. Add the barrel export to package.json: "./<area>": "./src/<area>/index.ts"
 *   3. Add a pattern below
 *   4. Migrate existing deep imports to the barrel
 */

const deepImportPatterns = [
  {
    group: ['@odh-dashboard/dashboard-foundation-frontend/concepts/areas/*'],
    message:
      'Deep import into concepts/areas/. Import from @odh-dashboard/dashboard-foundation-frontend/concepts/areas instead.',
  },
  // TEMPLATE — add more patterns as barrel files are created:
  //
  // {
  //   group: ['@odh-dashboard/dashboard-foundation-frontend/utilities/*/*'],
  //   message:
  //     'Deep import into utilities/. Import from @odh-dashboard/dashboard-foundation-frontend/utilities instead.',
  // },
];

/**
 * Returns the raw pattern array. Used by tierRestrictions() to append
 * these patterns to the @odh-dashboard/no-restricted-imports rule.
 */
const getDeepImportPatterns = () => deepImportPatterns;

module.exports = { getDeepImportPatterns };
