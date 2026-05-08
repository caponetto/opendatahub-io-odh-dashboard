import type { Extension, ComponentCodeRef } from '../core/types';

/**
 * Adds a route to the host application.
 */
export type RouteExtension = Extension<
  'app.route',
  {
    /** The component to render for this route. */
    component: ComponentCodeRef;
    /** The react-router path pattern to match against the current location. */
    path: string;
  }
>;

/**
 * Declares a client-side redirect from one path to another.
 *
 * Synthesized automatically by the PluginStore when an override patches
 * `href` or `path` on a navigation/route extension, but can also be
 * declared explicitly in any extensions file.
 */
export type RouteRedirectExtension = Extension<
  'app.route/redirect',
  {
    /** The path pattern to redirect from. */
    from: string;
    /** The target path to redirect to. */
    to: string;
  }
>;

export const ROUTE_REDIRECT_TYPE = 'app.route/redirect';

// Type guards

export const isRouteExtension = (e: Extension): e is RouteExtension => e.type === 'app.route';

export const isRouteRedirectExtension = (e: Extension): e is RouteRedirectExtension =>
  e.type === ROUTE_REDIRECT_TYPE;
