import type React from 'react';
import type { Action, Reducer } from 'redux';

export interface BrandingConfig {
  productName?: string;
  logo?: React.ComponentType | string;
  favicon?: string;
}

export interface AppShellConfig<S = unknown, A extends Action = Action> {
  /** The root application component */
  App: React.ComponentType;
  /** Application Redux reducer */
  appReducer: Reducer<S, A>;
  /** DOM element ID (default: 'root') */
  rootElementId?: string;
  /** Branding */
  branding?: BrandingConfig;
}
