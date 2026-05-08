import * as React from 'react';
import { TextInput } from '@patternfly/react-core';
import {
  trimInputOnBlur,
  trimInputOnPaste,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/trimInput';
import { FieldProps } from './types';
import DefaultValueTextRenderer from './DefaultValueTextRenderer';
import { ShortTextField } from '../types';

const ShortTextFormField: React.FC<FieldProps<ShortTextField>> = ({
  id,
  field,
  isDisabled,
  mode,
  onChange,
  value,
  'data-testid': dataTestId,
}) => {
  const isPreview = mode === 'preview';
  return (
    <DefaultValueTextRenderer id={id} field={field} mode={mode}>
      <TextInput
        aria-readonly={isPreview}
        autoComplete="off"
        isDisabled={isDisabled}
        isRequired={field.required}
        id={id}
        name={id}
        data-testid={dataTestId}
        value={(isPreview ? field.properties.defaultValue : value) ?? ''}
        onChange={isPreview || !onChange ? undefined : (_e, v) => onChange(v)}
        onBlur={(e) => trimInputOnBlur(value, onChange)(e)}
        onPaste={trimInputOnPaste(onChange)}
      />
    </DefaultValueTextRenderer>
  );
};

export default ShortTextFormField;
