import * as React from 'react';
import {
  HardwareProfileKind,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getCompatibleIdentifiers } from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageStreamUtils';
import HardwareProfileFormSection from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/HardwareProfileFormSection';
import { MODEL_SERVING_VISIBILITY } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/const';
import type { HardwarePodSpecOptions } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { HardwarePodSpecOptionsState } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/types';

type DeploymentHardwareProfileSectionProps = {
  podSpecOptionState: HardwarePodSpecOptionsState<HardwarePodSpecOptions>;
  projectName?: string;
  servingRuntimeSelected?: ServingRuntimeKind;
  isEditing?: boolean;
};

const DeploymentHardwareProfileSection = ({
  podSpecOptionState,
  projectName,
  servingRuntimeSelected,
  isEditing = false,
}: DeploymentHardwareProfileSectionProps): React.ReactNode => {
  const isHardwareProfileSupported = React.useCallback(
    (profile: HardwareProfileKind) => {
      if (!servingRuntimeSelected) {
        return false;
      }

      const compatibleIdentifiers = getCompatibleIdentifiers(servingRuntimeSelected);

      // if any of the identifiers in the image are included in the profile, return true
      return compatibleIdentifiers.some((imageIdentifier) =>
        profile.spec.identifiers?.some(
          (profileIdentifier) => profileIdentifier.identifier === imageIdentifier,
        ),
      );
    },
    [servingRuntimeSelected],
  );

  return (
    <>
      <HardwareProfileFormSection
        project={projectName}
        podSpecOptionsState={podSpecOptionState}
        isEditing={isEditing}
        isHardwareProfileSupported={isHardwareProfileSupported}
        visibleIn={MODEL_SERVING_VISIBILITY}
      />
    </>
  );
};

export default DeploymentHardwareProfileSection;
