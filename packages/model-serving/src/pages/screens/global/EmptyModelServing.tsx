import * as React from 'react';
import EmptyDetailsView from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyDetailsView';
import {
  ProjectObjectType,
  typedEmptyImage,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import ServeModelButton from './ServeModelButton';

const EmptyModelServing: React.FC = () => (
  <EmptyDetailsView
    title="No deployed models"
    description="To get started, deploy a model."
    iconImage={typedEmptyImage(ProjectObjectType.modelServer)}
    imageAlt="deploy a model"
    createButton={<ServeModelButton />}
  />
);

export default EmptyModelServing;
