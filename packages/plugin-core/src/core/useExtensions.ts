import * as React from 'react';
import { usePluginStore } from './PluginStoreContext';
import { PluginEventType } from './plugin-store';
import type { Extension, ExtensionPredicate, LoadedExtension } from './types';

export const useExtensions = <TExtension extends Extension = Extension>(
  predicate?: ExtensionPredicate<TExtension>,
): LoadedExtension<TExtension>[] => {
  const pluginStore = usePluginStore();
  const [extensions, setExtensions] = React.useState<LoadedExtension[]>(() =>
    pluginStore.getExtensions(),
  );

  React.useEffect(() => {
    setExtensions(pluginStore.getExtensions());

    return pluginStore.subscribe(
      [PluginEventType.ExtensionsChanged, PluginEventType.FeatureFlagsChanged],
      () => {
        setExtensions(pluginStore.getExtensions());
      },
    );
  }, [pluginStore]);

  return React.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (predicate ? extensions.filter(predicate) : extensions) as LoadedExtension<TExtension>[],
    [extensions, predicate],
  );
};
