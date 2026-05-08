import { Spinner, Flex, FlexItem, Popover } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import type { ModelResourceType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ContainerResources } from '@odh-dashboard/dashboard-foundation-frontend/types';
import ScopedLabel from '@odh-dashboard/dashboard-foundation-frontend/components/ScopedLabel';
import { ScopedType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/modelServing/constants';
import DashboardPopupIconButton from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardPopupIconButton';
import { getHardwareProfileDisplayName } from '#~/concepts/hardwareProfiles/pages/utils';
import { resourceTypeOf } from '#~/concepts/hardwareProfiles/utils';
import HardwareProfileDetailsPopover from '#~/concepts/hardwareProfiles/HardwareProfileDetailsPopover';
import HardwareProfileBindingStateLabel from '#~/concepts/hardwareProfiles/HardwareProfileBindingStateLabel';
import {
  HardwareProfileBindingState,
  type HardwareProfileBindingStateInfo,
} from '#~/concepts/hardwareProfiles/types';

type HardwareProfileTableColumnProps = {
  namespace: string;
  resource: NotebookKind | ModelResourceType;
  containerResources: ContainerResources | undefined;
  isActive?: boolean;
  bindingState: {
    bindingStateInfo: HardwareProfileBindingStateInfo | null;
    bindingStateLoaded: boolean;
    loadError: Error | undefined;
  };
};

const HardwareProfileTableColumn: React.FC<HardwareProfileTableColumnProps> = ({
  namespace,
  resource,
  containerResources,
  isActive = false,
  bindingState,
}) => {
  const isProjectScoped = useIsAreaAvailable(SupportedArea.DS_PROJECT_SCOPED).status;
  const { bindingStateInfo, bindingStateLoaded, loadError } = bindingState;
  const hardwareProfile = bindingStateInfo?.profile;

  if (loadError && bindingStateInfo?.state !== HardwareProfileBindingState.DELETED) {
    return (
      <Popover
        alertSeverityVariant="danger"
        headerContent="Error loading hardware profile"
        bodyContent={loadError.message || 'An error occurred while loading the hardware profile.'}
        triggerAction="hover"
        data-testid="hardware-profile-column-error-popover"
      >
        <DashboardPopupIconButton
          icon={
            <ExclamationCircleIcon color="red" data-testid="hardware-profile-column-error-icon" />
          }
          aria-label="Error info"
        />
      </Popover>
    );
  }
  if (!bindingStateLoaded) {
    return <Spinner size="md" />;
  }
  const displayName = hardwareProfile ? getHardwareProfileDisplayName(hardwareProfile) : 'Custom';
  const resourceType = resourceTypeOf(resource);
  return (
    <>
      <Flex
        spaceItems={{ default: 'spaceItemsSm' }}
        alignItems={{ default: 'alignItemsCenter' }}
        data-testid="hardware-profile-table-column"
      >
        {bindingStateInfo?.state !== HardwareProfileBindingState.DELETED && (
          <FlexItem>
            <HardwareProfileDetailsPopover
              hardwareProfile={hardwareProfile}
              resources={containerResources}
              tolerations={hardwareProfile?.spec.scheduling?.node?.tolerations}
              nodeSelector={hardwareProfile?.spec.scheduling?.node?.nodeSelector}
              localQueueName={hardwareProfile?.spec.scheduling?.kueue?.localQueueName}
              priorityClass={hardwareProfile?.spec.scheduling?.kueue?.priorityClass}
              tableView
            />
          </FlexItem>
        )}
        {isProjectScoped && hardwareProfile?.metadata.namespace === namespace && (
          <FlexItem>
            <ScopedLabel isProject color="blue" isCompact>
              {ScopedType.Project}
            </ScopedLabel>
          </FlexItem>
        )}
        {bindingStateInfo?.state && (
          <FlexItem>
            <HardwareProfileBindingStateLabel
              hardwareProfileBindingState={bindingStateInfo.state}
              hardwareProfileName={displayName}
              resourceType={resourceType}
              isRunning={isActive}
            />
          </FlexItem>
        )}
      </Flex>
    </>
  );
};

export default HardwareProfileTableColumn;
