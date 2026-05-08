import * as React from 'react';
import { PluginStore } from './plugin-store';

const PluginStoreContext = React.createContext<PluginStore | null>(null);

type PluginStoreProviderProps = React.PropsWithChildren<{
  store: PluginStore;
}>;

export const PluginStoreProvider: React.FC<PluginStoreProviderProps> = ({ children, store }) => (
  <PluginStoreContext.Provider value={store}>{children}</PluginStoreContext.Provider>
);

export const usePluginStore = (): PluginStore => {
  const store = React.useContext(PluginStoreContext);

  if (!store) {
    throw new Error('usePluginStore must be used within a PluginStoreProvider');
  }

  return store;
};
