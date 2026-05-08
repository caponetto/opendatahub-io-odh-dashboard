import React from 'react';
import { MaxHeightCodeEditor } from '@odh-dashboard/dashboard-foundation-frontend/components/MaxHeightCodeEditor';
import { NoValue } from '@odh-dashboard/dashboard-foundation-frontend/components/NoValue';
import { Value } from '../../../../third_party/mlmd';

interface MlmdPropertyValueProps {
  values: Value.AsObject;
  testId?: string;
}

export const MlmdPropertyDetailsValue: React.FC<MlmdPropertyValueProps> = ({ values, testId }) => {
  let value: React.ReactNode =
    values.stringValue || values.intValue || values.doubleValue || values.boolValue || '';

  if (values.structValue || values.protoValue) {
    value = (
      <MaxHeightCodeEditor
        isReadOnly
        code={JSON.stringify(values.structValue || values.protoValue, null, 2)}
        maxHeight={300}
        data-testid={testId}
      />
    );
  }

  if (!value && value !== 0) {
    return <NoValue />;
  }

  return value;
};
