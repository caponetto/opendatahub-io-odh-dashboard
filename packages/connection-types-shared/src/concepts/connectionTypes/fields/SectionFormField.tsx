import * as React from 'react';
import FormSection from '@odh-dashboard/dashboard-foundation-frontend/components/pf-overrides/FormSection';
import { SectionField } from '../types';

type Props = {
  field: SectionField;
  children?: React.ReactNode;
  'data-testid'?: string;
};

const SectionFormField: React.FC<Props> = ({
  field: { name, description },
  children,
  'data-testid': dataTestId,
}) => (
  <FormSection title={name} description={description} data-testid={dataTestId}>
    {children}
  </FormSection>
);

export default SectionFormField;
