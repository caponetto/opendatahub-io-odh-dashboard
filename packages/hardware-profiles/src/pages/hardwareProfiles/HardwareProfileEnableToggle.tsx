import React from 'react';
import { Switch } from '@patternfly/react-core';
import useNotification from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNotification';
import { HardwareProfileModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/odh';
import { toggleHardwareProfileEnablement } from '@odh-dashboard/hardware-profiles-shared/api/k8s/hardwareProfiles';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  useAccessAllowed,
  verbModelAccess,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/userSSAR';
import { HardwareProfileWarningType } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/types';
import {
  isHardwareProfileEnabled,
  validateProfileWarning,
} from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/pages/utils';

type HardwareProfileEnableToggleProps = {
  hardwareProfile: HardwareProfileKind;
  isDisabled?: boolean;
};

const HardwareProfileEnableToggle: React.FC<HardwareProfileEnableToggleProps> = ({
  hardwareProfile,
  isDisabled = false,
}) => {
  const hardwareProfileWarnings = validateProfileWarning(hardwareProfile);
  const enabled = isHardwareProfileEnabled(hardwareProfile);
  const warning = hardwareProfileWarnings.some(
    (hardwareProfileWarning) =>
      hardwareProfileWarning.type !==
      HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
  );
  const [isLoading, setLoading] = React.useState(false);
  const notification = useNotification();
  const [hasAccess, hasLoadedAccess] = useAccessAllowed(
    verbModelAccess('patch', HardwareProfileModel),
  );
  const canNotToggleSwitch = warning || isLoading || !hasAccess || !hasLoadedAccess || isDisabled;

  const handleChange = (checked: boolean) => {
    setLoading(true);
    toggleHardwareProfileEnablement(
      hardwareProfile.metadata.name,
      hardwareProfile.metadata.namespace,
      checked,
    )
      .catch((e) => {
        notification.error(
          `Error ${checked ? 'enable' : 'disable'} the hardware profile`,
          e.message,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Switch
      aria-label={enabled ? 'enabled' : 'stopped'}
      data-testid="enable-switch"
      id={`${hardwareProfile.metadata.name}-enable-switch`}
      isChecked={enabled && !warning}
      isDisabled={canNotToggleSwitch}
      onChange={(_e, checked) => handleChange(checked)}
    />
  );
};

export default HardwareProfileEnableToggle;
