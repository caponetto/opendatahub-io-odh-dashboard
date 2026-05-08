import { Label } from '@patternfly/react-core';
import * as React from 'react';
import { AccessMode } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { AccessModeLabelMap } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/storageEnums';

const AccessModeLabel: React.FC<{ accessMode: AccessMode }> = ({ accessMode }) => (
  <Label
    key={accessMode}
    data-testid={`${accessMode}-label`}
    color="blue"
    isCompact
    variant="outline"
  >
    {AccessModeLabelMap[accessMode]}
  </Label>
);

export default AccessModeLabel;
