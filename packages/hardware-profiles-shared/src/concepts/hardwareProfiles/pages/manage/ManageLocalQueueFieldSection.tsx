import { FormGroup, TextInput } from '@patternfly/react-core';
import * as React from 'react';
import DashboardHelpTooltip from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardHelpTooltip.tsx';
import { ManageHardwareProfileSectionID } from './types';
import { ManageHardwareProfileSectionTitles } from '../formConst';
import { HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP } from '../nodeResource/const';

type ManageLocalQueueFieldSectionProps = {
  localQueueName: string;
  disabled: boolean;
  setLocalQueueName: (updatedQueueName: string) => void;
};

const ManageLocalQueueFieldSection: React.FC<ManageLocalQueueFieldSectionProps> = ({
  localQueueName,
  setLocalQueueName,
  disabled,
}) => (
  <FormGroup
    label={ManageHardwareProfileSectionTitles[ManageHardwareProfileSectionID.LOCAL_QUEUE]}
    fieldId={ManageHardwareProfileSectionID.LOCAL_QUEUE}
    isRequired
    labelHelp={
      <DashboardHelpTooltip content={HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP.localQueue} />
    }
  >
    <TextInput
      data-testid="local-queue-input"
      id="local-queue-input"
      value={localQueueName}
      onChange={(_, updatedQueueName) => {
        setLocalQueueName(updatedQueueName);
      }}
      isRequired
      isDisabled={disabled}
    />
  </FormGroup>
);

export default ManageLocalQueueFieldSection;
