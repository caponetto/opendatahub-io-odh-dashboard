import React from 'react';
import { LazyCodeRefComponent, useExtensions } from '@odh-dashboard/plugin-core';
import { isOverviewSectionExtension } from '@odh-dashboard/plugin-core/extension-points';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';

const OverviewModelsSection: React.FC = () => {
  const serveModelsCardExtensions = useExtensions(isOverviewSectionExtension);
  const serveModelsCard = serveModelsCardExtensions.find(
    (tab) => tab.properties.id === ProjectSectionID.MODEL_SERVER,
  )?.properties.component;

  if (!serveModelsCard) {
    return null;
  }

  return <LazyCodeRefComponent component={serveModelsCard} />;
};

export default OverviewModelsSection;
