import * as React from 'react';
import { PluginStore, PluginStoreProvider } from '@odh-dashboard/plugin-core';

export const PluginStoreContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const store = React.useMemo(() => new PluginStore({}), []);
  return <PluginStoreProvider store={store}>{children}</PluginStoreProvider>;
};
