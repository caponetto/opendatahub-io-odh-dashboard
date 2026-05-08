import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { BiasMetricType } from '@odh-dashboard/model-serving-shared/concepts/trustyai/rawTypes';
import {
  asEnumMember,
  enumIterator,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/utils';
import SimpleSelect, {
  SimpleSelectOption,
} from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
import { isMetricType } from '../../../utils';
import { METRIC_TYPE_DESCRIPTION, METRIC_TYPE_DISPLAY_NAME } from '../../../const';

type MetricTypeFieldProps = {
  fieldId: string;
  value?: BiasMetricType;
  onChange: (value: BiasMetricType) => void;
};

const MetricTypeField: React.FC<MetricTypeFieldProps> = ({ fieldId, value, onChange }) => (
  <FormGroup label="Metric type" fieldId={fieldId}>
    <SimpleSelect
      onChange={(selection) => {
        const selectedValue = asEnumMember(selection, BiasMetricType);
        if (isMetricType(selectedValue)) {
          onChange(selectedValue);
        }
      }}
      options={enumIterator(BiasMetricType).map(
        ([, type]): SimpleSelectOption => ({
          key: type,
          label: METRIC_TYPE_DISPLAY_NAME[type],
          description: METRIC_TYPE_DESCRIPTION[type],
        }),
      )}
      value={value}
      toggleProps={{ id: fieldId }}
      popperProps={{ maxWidth: undefined }}
    />
  </FormGroup>
);

export default MetricTypeField;
