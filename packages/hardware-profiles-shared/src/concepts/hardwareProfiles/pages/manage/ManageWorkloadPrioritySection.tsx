import { FormGroup, Stack, StackItem } from '@patternfly/react-core';
import * as React from 'react';
import DashboardHelpTooltip from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardHelpTooltip';
import SimpleSelect, {
  SimpleSelectOption,
} from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
import useWorkloadPriorityClasses from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/useWorkloadPriorityClasses';
import { WorkloadPriorityClassKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import TruncatedText from '@odh-dashboard/dashboard-foundation-frontend/components/TruncatedText';
import { ManageHardwareProfileSectionID } from './types';
import { ManageHardwareProfileSectionTitles } from '../formConst';
import {
  DEFAULT_PRIORITY_CLASS,
  HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP,
} from '../nodeResource/const';

type ManageWorkloadPrioritySectionProps = {
  priorityClass: string;
  disabled: boolean;
  setWorkloadPriority: (prioritySelection: string) => void;
};

const ManageWorkloadPrioritySection: React.FC<ManageWorkloadPrioritySectionProps> = ({
  priorityClass,
  setWorkloadPriority,
  disabled,
}) => {
  const [workloadPriorityClasses, loaded, error] = useWorkloadPriorityClasses();

  const priorityOptions: SimpleSelectOption[] = React.useMemo(() => {
    const safeWorkloadPriorityClasses = workloadPriorityClasses ?? [];
    const noneOption = {
      key: DEFAULT_PRIORITY_CLASS,
      label: DEFAULT_PRIORITY_CLASS,
      dropdownLabel: DEFAULT_PRIORITY_CLASS,
    };

    if (!loaded || error) {
      if (priorityClass && priorityClass !== DEFAULT_PRIORITY_CLASS) {
        return [
          noneOption,
          {
            key: priorityClass,
            label: priorityClass,
            dropdownLabel: priorityClass,
          },
        ];
      }

      return [noneOption];
    }

    const options = [
      noneOption,
      ...safeWorkloadPriorityClasses.map((priority: WorkloadPriorityClassKind) => ({
        key: priority.metadata.name,
        label: priority.metadata.name,
        description: (
          <Stack>
            {priority.description && (
              <StackItem>
                <TruncatedText maxLines={1} content={priority.description} />
              </StackItem>
            )}
            {priority.value && <StackItem>{`Value: ${priority.value.toString()}`}</StackItem>}
          </Stack>
        ),
        dropdownLabel: priority.metadata.name,
      })),
    ];

    return options;
  }, [workloadPriorityClasses, loaded, error, priorityClass]);
  return (
    <FormGroup
      label={ManageHardwareProfileSectionTitles[ManageHardwareProfileSectionID.WORKLOAD_PRIORITY]}
      fieldId={ManageHardwareProfileSectionID.WORKLOAD_PRIORITY}
      labelHelp={
        <DashboardHelpTooltip
          content={HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP.workloadPriority}
        />
      }
    >
      <SimpleSelect
        value={priorityClass}
        options={priorityOptions}
        onChange={setWorkloadPriority}
        isFullWidth
        previewDescription
        isDisabled={disabled}
        isScrollable
        dataTestId="workload-priority-select"
      />
    </FormGroup>
  );
};

export default ManageWorkloadPrioritySection;
