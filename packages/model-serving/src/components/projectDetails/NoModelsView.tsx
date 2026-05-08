import React from 'react';
import EmptyDetailsView from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyDetailsView';
import {
  ProjectObjectType,
  typedEmptyImage,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import type { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { Stack, StackItem } from '@patternfly/react-core';
import ModelServingPlatformSelectErrorAlert from '../../concepts/Platforms/ModelServingPlatformSelectErrorAlert';
import { ModelServingPlatform } from '../../concepts/useProjectServingPlatform';
import { DeployButton } from '../deploy/DeployButton';

export const NoModelsView: React.FC<{
  platform: ModelServingPlatform;
  project: ProjectKind;
  errorSelectingPlatform?: Error;
  clearErrorSelectingPlatform: () => void;
}> = ({ platform, project, errorSelectingPlatform, clearErrorSelectingPlatform }) => (
  <EmptyDetailsView
    allowCreate
    iconImage={typedEmptyImage(ProjectObjectType.modelServer)}
    imageAlt="No deployed models"
    title={platform.properties.deployedModelsView.startHintTitle}
    description={
      <Stack hasGutter>
        {errorSelectingPlatform && (
          <ModelServingPlatformSelectErrorAlert
            error={errorSelectingPlatform}
            clearError={clearErrorSelectingPlatform}
          />
        )}
        <StackItem>{platform.properties.deployedModelsView.startHintDescription}</StackItem>
      </Stack>
    }
    createButton={<DeployButton project={project} />}
  />
);
