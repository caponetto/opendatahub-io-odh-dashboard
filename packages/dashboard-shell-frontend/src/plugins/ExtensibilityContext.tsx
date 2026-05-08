import * as React from 'react';
import { PluginStore, PluginStoreProvider } from '@odh-dashboard/plugin-core';
import { useAppExtensions } from './useAppExtensions';

/**
 * Extension loading model:
 *
 *  - **Static (plugin packages):** Extensions from workspace packages with
 *    `./extensions` exports, discovered at build time by GenerateExtensionsPlugin.
 *    This includes dashboard-shell-frontend's own extensions (navigation, routes, tasks).
 *
 *  - **Dynamic (MF):** Remote module extensions loaded at runtime via Module
 *    Federation. These contribute package-specific extensions from separately
 *    built services (model-registry, gen-ai, etc.).
 *
 * Both sources are merged in `useAppExtensions` and fed into a single
 * `PluginStore`.
 */
export const ExtensibilityContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [appExtensions, loaded] = useAppExtensions();

  const store = React.useMemo(
    () => (loaded ? new PluginStore(appExtensions) : null),
    [appExtensions, loaded],
  );
  return store ? <PluginStoreProvider store={store}>{children}</PluginStoreProvider> : null;
};
