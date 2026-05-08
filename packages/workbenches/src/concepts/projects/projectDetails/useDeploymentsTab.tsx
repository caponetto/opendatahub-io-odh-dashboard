import React from 'react';
import { LazyCodeRefComponent, useExtensions } from '@odh-dashboard/plugin-core';
import { isProjectDetailsTab } from '@odh-dashboard/plugin-core/extension-points';
import useModelServingEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelServingEnabled';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { SectionDefinition } from '../../../pages/components/GenericHorizontalBar';

export const useDeploymentsTab = (): SectionDefinition[] => {
  const modelServingEnabled = useModelServingEnabled();

  const projectDetailsTabExtensions = useExtensions(isProjectDetailsTab);
  const deploymentsProjectDetailsTab = projectDetailsTabExtensions.find(
    (tab) => tab.properties.id === ProjectSectionID.MODEL_SERVER,
  )?.properties.component;

  const tab: SectionDefinition[] =
    modelServingEnabled && deploymentsProjectDetailsTab
      ? [
          {
            id: ProjectSectionID.MODEL_SERVER,
            title: 'Deployments',
            component: <LazyCodeRefComponent component={deploymentsProjectDetailsTab} />,
          },
        ]
      : [];

  return tab;
};
