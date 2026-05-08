import React from 'react';
import { FormGroup, Stack, StackItem } from '@patternfly/react-core';
import { useZodFormValidation } from '@odh-dashboard/dashboard-foundation-frontend/hooks/useZodFormValidation';
import NumberInputWrapper from '@odh-dashboard/dashboard-foundation-frontend/components/NumberInputWrapper';
import { ZodErrorHelperText } from '@odh-dashboard/dashboard-foundation-frontend/components/ZodErrorFormHelperText';
import { trainingNodeSchema } from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/validationUtils';

type TrainingNodeInputProps = {
  data: number;
  setData: (data: number) => void;
};

const TrainingNodeInput: React.FC<TrainingNodeInputProps> = ({ data, setData }) => {
  const { getFieldValidation, getFieldValidationProps } = useZodFormValidation(
    data,
    trainingNodeSchema,
  );

  return (
    <FormGroup label="Training nodes" isRequired>
      <Stack hasGutter>
        <StackItem>
          Specify the total number of nodes that will be used in the run. 1 node will be used for
          the evaluation run phase.
        </StackItem>
        <StackItem>
          <NumberInputWrapper
            data-testid="training-node"
            min={1}
            value={data}
            onChange={(value) => {
              if (typeof value === 'number') {
                setData(value);
              }
            }}
            {...getFieldValidationProps()}
          />
          <ZodErrorHelperText zodIssue={getFieldValidation()} />
        </StackItem>
      </Stack>
    </FormGroup>
  );
};

export default TrainingNodeInput;
