import * as React from 'react';
import { Button, FormGroup, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import {
  EnvVariable,
  EnvironmentVariableType,
} from '@odh-dashboard/connection-types-shared/concepts/workbench/envVariableFormTypes';
import IndentSection from '@odh-dashboard/dashboard-foundation-frontend/components/IndentSection';
import {
  asEnumMember,
  getDashboardMainContainer,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/utils';
import SimpleSelect, {
  SimpleSelectOption,
} from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
import EnvTypeSwitch from './EnvTypeSwitch';

type EnvTypeSelectFieldProps = {
  envVariable: EnvVariable;
  onUpdate: (envVariable: EnvVariable) => void;
  onRemove: () => void;
};

const EnvTypeSelectField: React.FC<EnvTypeSelectFieldProps> = ({
  envVariable,
  onUpdate,
  onRemove,
}) => (
  <FormGroup isRequired label="Variable type" fieldId="environment-variable-type-select">
    <Split data-testid="environment-variable-field">
      <SplitItem isFilled>
        <Stack hasGutter>
          <StackItem data-testid="environment-variable-type-select">
            <SimpleSelect
              toggleProps={{ id: 'environment-variable-type-select' }}
              popperProps={{ appendTo: getDashboardMainContainer() }}
              isFullWidth
              value={envVariable.type ?? undefined}
              placeholder="Select environment variable type"
              options={Object.values(EnvironmentVariableType).map(
                (type): SimpleSelectOption => ({
                  key: type,
                  label: type,
                }),
              )}
              onChange={(value) => {
                const enumValue = asEnumMember(value, EnvironmentVariableType);
                if (enumValue !== null) {
                  onUpdate({
                    type: enumValue,
                  });
                }
              }}
            />
          </StackItem>
          {envVariable.type && (
            <StackItem>
              <IndentSection>
                <EnvTypeSwitch
                  env={envVariable}
                  onUpdate={(envValue) => onUpdate({ ...envVariable, values: envValue })}
                />
              </IndentSection>
            </StackItem>
          )}
        </Stack>
      </SplitItem>
      <SplitItem>
        <Button
          variant="plain"
          data-testid="remove-environment-variable-button"
          aria-label="Remove environment variable"
          icon={<MinusCircleIcon />}
          onClick={() => onRemove()}
        />
      </SplitItem>
    </Split>
  </FormGroup>
);

export default EnvTypeSelectField;
