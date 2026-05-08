import * as React from 'react';
import FormGroupText from '@odh-dashboard/dashboard-foundation-frontend/components/FormGroupText';
import { FieldMode } from './types';
import UnspecifiedValue from './UnspecifiedValue';
import { ConnectionTypeDataField } from '../types';
import { defaultValueToString } from '../utils';

type Props = {
  id: string;
  field: ConnectionTypeDataField;
  mode?: FieldMode;
  children: React.ReactNode;
  component?: 'div' | 'pre';
};

const DefaultValueTextRenderer: React.FC<Props> = ({ id, field, mode, children, component }) =>
  mode !== 'default' && field.properties.defaultReadOnly ? (
    <FormGroupText id={id} component={component}>
      {defaultValueToString(field) ?? (mode === 'preview' ? <UnspecifiedValue /> : '-')}
    </FormGroupText>
  ) : (
    children
  );

export default DefaultValueTextRenderer;
