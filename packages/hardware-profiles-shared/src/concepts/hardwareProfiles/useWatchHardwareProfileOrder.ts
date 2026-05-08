import * as React from 'react';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { fetchDashboardConfig } from '@odh-dashboard/dashboard-foundation-frontend/services/dashboardConfigService';

/**
 * Polls dashboard config for the ordered list of hardware profile names.
 */
export const useWatchHardwareProfileOrder = (): string[] => {
  const [hardwareProfileOrder, setHardwareProfileOrder] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    let watchHandle: ReturnType<typeof setTimeout>;
    const watchDashboardConfig = () => {
      fetchDashboardConfig()
        .then((config) => {
          if (!cancelled) {
            setHardwareProfileOrder(config.spec.hardwareProfileOrder || []);
          }
        })
        .catch(() => {
          /* keep previous order */
        });
      watchHandle = setTimeout(watchDashboardConfig, POLL_INTERVAL);
    };
    watchDashboardConfig();

    return () => {
      cancelled = true;
      clearTimeout(watchHandle);
    };
  }, []);

  return hardwareProfileOrder;
};
