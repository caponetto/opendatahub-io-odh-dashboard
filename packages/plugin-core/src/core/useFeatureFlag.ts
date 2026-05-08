import * as React from 'react';
import { usePluginStore } from './PluginStoreContext';
import { PluginEventType } from './plugin-store';

export const useFeatureFlag = (flagName: string): [boolean] => {
  const pluginStore = usePluginStore();
  const [isEnabled, setIsEnabled] = React.useState(
    () => pluginStore.getFeatureFlags()[flagName] === true,
  );

  React.useEffect(() => {
    const updateFlagValue = () => {
      setIsEnabled(pluginStore.getFeatureFlags()[flagName] === true);
    };

    updateFlagValue();

    return pluginStore.subscribe([PluginEventType.FeatureFlagsChanged], updateFlagValue);
  }, [flagName, pluginStore]);

  return React.useMemo(() => [isEnabled], [isEnabled]);
};
