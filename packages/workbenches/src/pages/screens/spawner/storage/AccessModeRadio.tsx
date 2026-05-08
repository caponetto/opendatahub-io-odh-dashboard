import { Radio, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { AccessMode } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { toAccessModeFullName } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/accessModeUtils';

type AccessModeRadioProps = {
  id: string;
  name: string;
  accessMode: AccessMode;
  isDisabled: boolean;
  isChecked: boolean;
  tooltipContent?: string;
  onChange: () => void;
};

const AccessModeRadio: React.FC<AccessModeRadioProps> = ({
  id,
  name,
  accessMode,
  isDisabled,
  isChecked,
  tooltipContent,
  onChange,
}) => {
  const radioField = (
    <Radio
      id={id}
      name={name}
      data-testid={id}
      isDisabled={isDisabled}
      isChecked={isChecked}
      onChange={onChange}
      label={toAccessModeFullName(accessMode)}
    />
  );
  if (tooltipContent) {
    return <Tooltip content={tooltipContent}>{radioField}</Tooltip>;
  }
  return radioField;
};

export default AccessModeRadio;
