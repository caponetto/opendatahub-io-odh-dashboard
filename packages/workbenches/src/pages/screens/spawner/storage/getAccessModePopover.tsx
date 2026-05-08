import * as React from 'react';
import {
  ACCESS_MODE_DESCRIPTIONS,
  toAccessModeFullName,
} from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/accessModeUtils';
import PopoverListContent from '@odh-dashboard/dashboard-foundation-frontend/components/PopoverListContent';
import { AccessMode } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

type AccessModePopoverProps = {
  canEditAccessMode?: boolean;
  currentAccessMode?: AccessMode;
  showAllAccessModes?: boolean;
  adminSupportedAccessModes?: AccessMode[];
};

export const getAccessModePopover = ({
  canEditAccessMode = true,
  currentAccessMode,
  showAllAccessModes = true,
  adminSupportedAccessModes,
}: AccessModePopoverProps): React.ReactNode => {
  const listItems: React.ReactNode[] = [];

  Object.values(AccessMode).forEach((accessMode) => {
    const hasAccessMode = adminSupportedAccessModes?.includes(accessMode);

    if (
      showAllAccessModes ||
      ((accessMode === AccessMode.RWO || hasAccessMode) && canEditAccessMode) ||
      currentAccessMode === accessMode
    ) {
      listItems.push(
        <React.Fragment key={accessMode}>
          <strong>{toAccessModeFullName(accessMode)}</strong> {ACCESS_MODE_DESCRIPTIONS[accessMode]}
        </React.Fragment>,
      );
    }
  });

  return (
    <PopoverListContent
      leadText="Access mode is a Kubernetes concept that determines how nodes can interact with the volume."
      listItems={listItems}
    />
  );
};
