import React from 'react';
import { MaxHeightCodeEditor } from '@odh-dashboard/dashboard-foundation-frontend/components/MaxHeightCodeEditor';
import { NoValue } from '@odh-dashboard/dashboard-foundation-frontend/components/NoValue';
import { MlmdMetadataValueType } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/utils';

type ExecutionDetailsPropertiesValueProps = {
  value: MlmdMetadataValueType;
};

export const ExecutionDetailsPropertiesValueCode: React.FC<
  Pick<React.ComponentProps<typeof MaxHeightCodeEditor>, 'code'>
> = ({ code }) => (
  <MaxHeightCodeEditor
    isReadOnly
    code={code}
    maxHeight={300}
    data-testid="execution-value-code-editor"
  />
);

const ExecutionDetailsPropertiesValue: React.FC<ExecutionDetailsPropertiesValueProps> = ({
  value,
}) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'number' || (typeof value === 'string' && !Number.isNaN(value))) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const jsonValue = JSON.parse(value);

      if (parseFloat(jsonValue ?? '')) {
        throw value;
      }

      return <ExecutionDetailsPropertiesValueCode code={JSON.stringify(jsonValue, null, 2)} />;
    } catch {
      // not JSON, return directly
      return value || <NoValue />;
    }
  }

  // value is Struct
  const jsObject = value.toJavaScript();
  // When Struct is converted to js object, it may contain a top level "struct"
  // or "list" key depending on its type, but the key is meaningless and we can
  // omit it in visualization.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Struct to plain object for display
  const plain = jsObject as Record<string, unknown>;
  return (
    <ExecutionDetailsPropertiesValueCode
      code={JSON.stringify(plain.struct ?? plain.list ?? jsObject, null, 2)}
    />
  );
};

export default ExecutionDetailsPropertiesValue;
