import type { SupportedComponentFlagValue } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { Extension } from '../core/types';

/**
 * Provides feature flags for the host application.
 */
export type AreaExtension = Extension<
  'app.area',
  SupportedComponentFlagValue & {
    /**
     * The ID of the area.
     */
    id: string;
  }
>;

// Type guards

export const isAreaExtension = (e: Extension): e is AreaExtension => e.type === 'app.area';
