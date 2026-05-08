import * as React from 'react';
import BooleanFormField from './BooleanFormField';
import DropdownFormField from './DropdownFormField';
import FileFormField from './FileFormField';
import HiddenFormField from './HiddenFormField';
import NumericFormField from './NumericFormField';
import TextFormField from './TextFormField';
import ShortTextFormField from './ShortTextFormField';
import UriFormField from './UriFormField';
import { FieldProps } from './types';
import { ConnectionTypeDataField, ConnectionTypeFieldType } from '../types';

const components = {
  [ConnectionTypeFieldType.ShortText]: ShortTextFormField,
  [ConnectionTypeFieldType.Text]: TextFormField,
  [ConnectionTypeFieldType.URI]: UriFormField,
  [ConnectionTypeFieldType.Hidden]: HiddenFormField,
  [ConnectionTypeFieldType.File]: FileFormField,
  [ConnectionTypeFieldType.Boolean]: BooleanFormField,
  [ConnectionTypeFieldType.Numeric]: NumericFormField,
  [ConnectionTypeFieldType.Dropdown]: DropdownFormField,
};

const ConnectionTypeDataFormField = <T extends ConnectionTypeDataField>(
  props: FieldProps<T>,
): React.ReactNode => {
  const Component = components[props.field.type];
  return (
    <Component
      // delegate all props to the component
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-explicit-any
      {...(props as any)}
    />
  );
};

export default ConnectionTypeDataFormField;
