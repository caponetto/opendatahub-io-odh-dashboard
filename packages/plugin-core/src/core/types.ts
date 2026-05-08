export type {
  AnyObject,
  CodeRef,
  ComponentCodeRef,
  Extension,
  ExtensionFlags,
  ExtensionPredicate,
  FeatureFlags,
  LoadedExtension,
  ResolvedExtension,
} from '@odh-dashboard/plugin-types';

/**
 * Feature flag name injected into the plugin store to indicate the current user
 * has admin privileges.
 *
 * @deprecated This flag is a transitional mechanism. Extensions should migrate
 * to RBAC-based access checks (e.g. `useAccessReview`) instead of gating on
 * this feature flag. Once all consumers are migrated, this constant and the
 * corresponding injection in PluginStoreAreaFlagsProvider will be removed.
 *
 * Tracked consumers:
 *   - dashboard-shell-frontend/src/plugins/extensions/navigation.ts
 *   - admin/extensions.ts
 *   - connection-types/extensions.ts
 *   - storage-classes/extensions.ts
 *   - model-registry/extensions.ts
 *   - model-serving/extensions/odh.ts
 *   - observability/extensions.ts
 *   - maas/frontend/src/odh/odhExtensions/odhExtensions.ts
 */
export const ADMIN_USER = 'ADMIN_USER';
