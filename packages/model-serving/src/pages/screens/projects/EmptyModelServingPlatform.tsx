import * as React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateFooter } from '@patternfly/react-core';
import gearsImg from '@odh-dashboard/dashboard-foundation-frontend/images/gears.svg';
import WhosMyAdministrator from '@odh-dashboard/dashboard-foundation-frontend/components/WhosMyAdministrator';

const EmptyModelServingPlatform: React.FC = () => (
  <EmptyState
    headingLevel="h3"
    icon={() => <img src={gearsImg} alt="settings" />}
    titleText="No model serving platform selected"
    variant="xs"
  >
    <EmptyStateBody>
      To enable model serving, an administrator must first select a model serving platform in the
      cluster settings.
    </EmptyStateBody>
    <EmptyStateFooter>
      <WhosMyAdministrator />
    </EmptyStateFooter>
  </EmptyState>
);

export default EmptyModelServingPlatform;
