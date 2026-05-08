import type { Extension } from '../core/types';

/**
 * Declaratively patches or hides an extension contributed by another package.
 *
 * Assemblers and extension packages can use this to customize the behavior of
 * extensions they don't own (e.g., change a nav item's title, promote it to
 * the top level, or remove it entirely).
 *
 * Overrides are applied after feature-flag filtering in the PluginStore.
 * Override extensions themselves are removed from the final extension list.
 */
export type ExtensionOverride = Extension<
  'app.extension/override',
  {
    /** The `type` of the target extension (e.g., `'app.navigation/section'`). */
    targetType: string;
    /** The `id` property of the target extension to override. */
    targetId: string;
    /**
     * Properties to shallow-merge into the target's `properties`.
     * Use `null` to unset (delete) a property from the target.
     */
    patch?: Record<string, unknown>;
    /** If `true`, the target extension is removed entirely. */
    hide?: boolean;
  }
>;

export const EXTENSION_OVERRIDE_TYPE = 'app.extension/override';

export const isExtensionOverride = (e: Extension): e is ExtensionOverride =>
  e.type === EXTENSION_OVERRIDE_TYPE;
