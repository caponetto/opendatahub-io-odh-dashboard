import React from 'react';
import { AreaContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { ADMIN_USER, usePluginStore } from '@odh-dashboard/plugin-core';
import type { FeatureFlags } from '@odh-dashboard/plugin-core';

export const PluginStoreAreaFlagsProvider: React.FC = () => {
  const { isAdmin } = useUser();
  const pluginStore = usePluginStore();
  const { areasStatus } = React.useContext(AreaContext);

  const flags = React.useMemo(
    () =>
      Object.keys(areasStatus).reduce<FeatureFlags>((acc, area) => {
        const status = areasStatus[area]?.status;
        if (status != null) {
          acc[area] = status;
        }
        return acc;
      }, {}),
    [areasStatus],
  );

  // ADMIN_USER is @deprecated — see @odh-dashboard/plugin-core types.ts for consumer
  // tracking. Remove once RBAC migration is complete and all extensions use RBAC guards.
  React.useEffect(
    () => pluginStore.setFeatureFlags({ ...flags, [ADMIN_USER]: isAdmin }),
    [flags, pluginStore, isAdmin],
  );
  return null;
};
