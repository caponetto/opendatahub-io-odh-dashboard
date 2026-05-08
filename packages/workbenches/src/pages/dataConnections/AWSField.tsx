import * as React from 'react';
import { EnvVariableDataEntry } from '@odh-dashboard/connection-types-shared/concepts/workbench/envVariableFormTypes';
import FieldList from '@odh-dashboard/dashboard-foundation-frontend/components/FieldList';
import { getAdditionalRequiredAWSFields } from '@odh-dashboard/workbenches/pages/screens/spawner/spawnerUtils';

type AWSFieldProps = {
  values: EnvVariableDataEntry[];
  onUpdate: (data: EnvVariableDataEntry[]) => void;
  additionalRequiredFields?: string[];
};

const AWSField: React.FC<AWSFieldProps> = ({ values, onUpdate, additionalRequiredFields }) => (
  <FieldList
    values={values}
    onUpdate={onUpdate}
    fields={getAdditionalRequiredAWSFields(additionalRequiredFields)}
  />
);

export default AWSField;
