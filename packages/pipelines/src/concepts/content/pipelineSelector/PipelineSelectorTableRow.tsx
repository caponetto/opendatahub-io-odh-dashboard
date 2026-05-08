import * as React from 'react';
import { Stack, StackItem, Tooltip } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';
import { relativeTime } from '@odh-dashboard/dashboard-foundation-frontend/utilities/time';
import {
  ExperimentKF,
  PipelineKF,
  PipelineVersionKF,
} from '@odh-dashboard/pipelines/concepts/kfTypes';

type PipelineSelectorTableRowProps = {
  obj: PipelineKF | PipelineVersionKF | ExperimentKF;
  onClick: () => void;
  isRowSelected?: boolean;
};

const PipelineSelectorTableRow: React.FC<PipelineSelectorTableRowProps> = ({
  obj,
  onClick,
  isRowSelected = false,
}) => {
  const tooltipRef = React.useRef(null);

  return (
    <>
      <Tooltip
        position="right"
        isContentLeftAligned
        content={
          <Stack hasGutter>
            <StackItem>
              Name:
              <br />
              {obj.display_name}
            </StackItem>
            {obj.description && (
              <StackItem>
                Description:
                <br />
                {obj.description}
              </StackItem>
            )}
          </Stack>
        }
        triggerRef={tooltipRef}
      />
      <Tr isRowSelected={isRowSelected} ref={tooltipRef} onRowClick={onClick} isClickable>
        <Td width={70} modifier="truncate" tooltip={null}>
          {obj.display_name}
        </Td>
        <Td width={30}>{relativeTime(Date.now(), new Date(obj.created_at).getTime())}</Td>
      </Tr>
    </>
  );
};

export default PipelineSelectorTableRow;
