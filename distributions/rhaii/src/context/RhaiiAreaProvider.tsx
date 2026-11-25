import React, { useLayoutEffect, useMemo, useState, type FC, type PropsWithChildren } from 'react';
import { useFeatureFlag, usePluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  AreaContext,
  SupportedArea,
  type IsAreaAvailableStatus,
} from '@odh-dashboard/plugin-core/areas';
import { useBootstrapState } from './AppBootstrapProvider';

const availableAreaStatus: IsAreaAvailableStatus = {
  status: true,
  devFlags: null,
  featureFlags: null,
  reliantAreas: null,
  requiredCapabilities: null,
  requiredComponents: null,
};

/**
 * MODEL_SERVING is the statically composed hub and always available; the serving
 * areas follow the discovered capabilities.
 */
const getAreasStatus = (
  unifiedProjectSelectorEnabled: boolean,
  capabilities: { kServe: boolean; llmdServing: boolean },
): Record<string, IsAreaAvailableStatus> => ({
  [SupportedArea.MODEL_SERVING]: availableAreaStatus,
  [SupportedArea.K_SERVE]: { ...availableAreaStatus, status: capabilities.kServe },
  [SupportedArea.LLMD_SERVING]: { ...availableAreaStatus, status: capabilities.llmdServing },
  [SupportedArea.UNIFIED_PROJECT_SELECTOR]: {
    ...availableAreaStatus,
    status: unifiedProjectSelectorEnabled,
  },
});

/**
 * Mirror the discovered area statuses into the plugin store's feature flags so
 * area-gated extensions follow real cluster capabilities. Children are revealed
 * only after the flags apply, so no extension activates ungated.
 */
const RhaiiAreaProvider: FC<PropsWithChildren> = ({ children }) => {
  const [unifiedProjectSelectorEnabled] = useFeatureFlag('unified-project-selector');
  const { capabilities } = useBootstrapState();
  const pluginStore = usePluginStore();

  const areasStatus = useMemo(
    () => getAreasStatus(unifiedProjectSelectorEnabled === true, capabilities),
    [unifiedProjectSelectorEnabled, capabilities],
  );

  const areaContextValue = useMemo(
    () => ({
      dscStatus: null,
      dsciStatus: null,
      areasStatus,
    }),
    [areasStatus],
  );

  const areaFlags = useMemo(() => {
    const flags: Record<string, boolean> = {};
    for (const [area, status] of Object.entries(areasStatus)) {
      flags[area] = status.status;
    }
    return flags;
  }, [areasStatus]);

  const [areaFlagsApplied, setAreaFlagsApplied] = useState(false);
  useLayoutEffect(() => {
    pluginStore.setFeatureFlags(areaFlags);
    setAreaFlagsApplied(true);
  }, [pluginStore, areaFlags]);

  // AppBootstrapProvider owns the spinner; no fallback UI here.
  if (!areaFlagsApplied) {
    return null;
  }

  return <AreaContext.Provider value={areaContextValue}>{children}</AreaContext.Provider>;
};

export default RhaiiAreaProvider;
