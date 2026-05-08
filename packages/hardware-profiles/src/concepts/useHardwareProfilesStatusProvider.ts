import React from 'react';
import type { StatusProviderHook } from '@odh-dashboard/plugin-core/extension-points';
import { useWatchHardwareProfiles } from '@odh-dashboard/hardware-profiles-shared/utilities/useWatchHardwareProfiles';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import {
  generateWarningForHardwareProfiles,
  HardwareProfileBannerWarningTitles,
} from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/pages/utils';

// todo: ask if this hook is still needed (to @christian vogt to start)
export const useHardwareProfilesStatusProvider: StatusProviderHook = () => {
  const { dashboardNamespace } = useDashboardNamespace();
  const [hardwareProfiles] = useWatchHardwareProfiles(dashboardNamespace);
  const safeHardwareProfiles = React.useMemo(() => hardwareProfiles ?? [], [hardwareProfiles]);

  const warning = generateWarningForHardwareProfiles(safeHardwareProfiles);
  const warningMessage =
    warning?.title === HardwareProfileBannerWarningTitles.ALL_INVALID ? warning.title : undefined;

  return React.useMemo(
    () => (warningMessage ? { status: 'warning', message: warningMessage } : undefined),
    [warningMessage],
  );
};
