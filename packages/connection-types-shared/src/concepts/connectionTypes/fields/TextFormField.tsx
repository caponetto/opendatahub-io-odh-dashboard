import * as React from 'react';
import { TextArea } from '@patternfly/react-core';
import {
  trimInputOnBlur,
  trimInputOnPaste,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/trimInput';
import { FieldProps } from './types';
import DefaultValueTextRenderer from './DefaultValueTextRenderer';
import { TextField } from '../types';

const TextFormField: React.FC<FieldProps<TextField>> = ({
  id,
  field,
  mode,
  onChange,
  value,
  'data-testid': dataTestId,
}) => {
  const isPreview = mode === 'preview';
  return (
    <DefaultValueTextRenderer id={id} field={field} mode={mode} component="pre">
      <TextArea
        aria-readonly={isPreview}
        autoComplete="off"
        isRequired={field.required}
        id={id}
        name={id}
        data-testid={dataTestId}
        resizeOrientation="vertical"
        value={(isPreview ? field.properties.defaultValue : value) ?? ''}
        onChange={isPreview || !onChange ? undefined : (_e, v) => onChange(v)}
        onBlur={(e) => trimInputOnBlur(value, onChange)(e)}
        onPaste={trimInputOnPaste(onChange)}
      />
    </DefaultValueTextRenderer>
  );
};

export default TextFormField;
