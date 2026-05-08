import * as React from 'react';
import { EyeIcon } from '@patternfly/react-icons';
import { Button, Flex, FlexItem, Popover } from '@patternfly/react-core';
import PasswordInput from '@odh-dashboard/dashboard-foundation-frontend/components/PasswordInput';
import FormGroupText from '@odh-dashboard/dashboard-foundation-frontend/components/FormGroupText';
import {
  trimInputOnBlur,
  trimInputOnPaste,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/trimInput';
import { FieldProps } from './types';
import UnspecifiedValue from './UnspecifiedValue';
import { SensitiveFieldHelperText } from './SensitiveFieldHelperText';
import { HiddenField } from '../types';

const HiddenFormField: React.FC<FieldProps<HiddenField>> = ({
  id,
  field,
  mode,
  onChange,
  value,
  'data-testid': dataTestId,
}) => {
  const isPreview = mode === 'preview';
  return (
    <>
      {mode !== 'default' && field.properties.defaultReadOnly ? (
        <FormGroupText id={id}>
          {field.properties.defaultValue ? (
            <Flex
              display={{ default: 'inlineFlex' }}
              flexWrap={{ default: 'nowrap' }}
              gap={{ default: 'gapSm' }}
              style={{ maxWidth: '100%' }}
            >
              <FlexItem
                style={{ flexGrow: 1, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {field.properties.defaultValue.replace(/./g, '•')}
              </FlexItem>
              <FlexItem style={{ flexShrink: 0 }}>
                <Popover bodyContent={field.properties.defaultValue}>
                  <Button isInline variant="link" icon={<EyeIcon />}>
                    View value
                  </Button>
                </Popover>
              </FlexItem>
            </Flex>
          ) : isPreview ? (
            <UnspecifiedValue />
          ) : (
            '-'
          )}
        </FormGroupText>
      ) : (
        <PasswordInput
          aria-readonly={isPreview}
          autoComplete="off"
          isRequired={field.required}
          id={id}
          name={id}
          data-testid={dataTestId}
          ariaLabelHide="Hide value"
          ariaLabelShow="Show value"
          value={(isPreview ? field.properties.defaultValue : value) ?? ''}
          onChange={isPreview || !onChange ? undefined : (_e, v) => onChange(v)}
          onBlur={(e) => trimInputOnBlur(value, onChange)(e)}
          onPaste={trimInputOnPaste(onChange)}
        />
      )}
      <SensitiveFieldHelperText field={field} mode={mode} />
    </>
  );
};

export default HiddenFormField;
