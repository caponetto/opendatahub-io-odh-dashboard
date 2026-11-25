import React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { isConnectionTypeDataField } from '@odh-dashboard/k8s-core';
import type { HostApiServices } from '@odh-dashboard/plugin-core/host-api';
import { trimInputOnBlur, trimInputOnPaste } from '@odh-dashboard/ui-core/utilities';

/** Renders the built-in URI connection type's field as a model-URI input. */
const UriConnectionFormFields: HostApiServices['ConnectionTypeFormFields'] = ({
  fields,
  isDisabled,
  onChange,
  connectionValues,
}) => {
  const uriField = fields?.find(
    (field) => isConnectionTypeDataField(field) && field.envVar === 'URI',
  );

  if (!uriField || !isConnectionTypeDataField(uriField)) {
    return null;
  }

  const currentValue = connectionValues?.[uriField.envVar];
  const stringValue = typeof currentValue === 'string' ? currentValue : '';
  const handleChange = (value: string) => onChange?.(uriField, value);

  return (
    <FormGroup label={uriField.name} fieldId="rhaii-model-uri" isRequired={uriField.required}>
      <TextInput
        autoComplete="off"
        id="rhaii-model-uri"
        data-testid="rhaii-model-uri"
        value={stringValue}
        isDisabled={isDisabled}
        isRequired={uriField.required}
        onChange={(_event, value) => handleChange(value)}
        onBlur={trimInputOnBlur(stringValue, handleChange)}
        onPaste={trimInputOnPaste(handleChange)}
      />
    </FormGroup>
  );
};

export default UriConnectionFormFields;
