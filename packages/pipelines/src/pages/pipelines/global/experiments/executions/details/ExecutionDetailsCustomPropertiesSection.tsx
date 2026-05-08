import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import ExecutionDetailsPropertiesValue from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/details/ExecutionDetailsPropertiesValue';
import { getMlmdMetadataValue } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/utils';
import { Execution } from '../../../../../../third_party/mlmd';

type ExecutionDetailsCustomPropertiesSectionProps = {
  execution: Execution;
};

const ExecutionDetailsCustomPropertiesSection: React.FC<
  ExecutionDetailsCustomPropertiesSectionProps
> = ({ execution }) => {
  const propertiesMap = execution.getCustomPropertiesMap();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h3">Custom properties</Title>
      </StackItem>
      <StackItem>
        {propertiesMap.getEntryList().length === 0 ? (
          'No custom properties'
        ) : (
          <DescriptionList isHorizontal isCompact>
            {propertiesMap.getEntryList().map((p: [string, unknown]) => (
              <DescriptionListGroup key={p[0]} style={{ alignItems: 'start' }}>
                <DescriptionListTerm>{p[0]}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ExecutionDetailsPropertiesValue
                    value={getMlmdMetadataValue(propertiesMap.get(p[0]))}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        )}
      </StackItem>
    </Stack>
  );
};

export default ExecutionDetailsCustomPropertiesSection;
