import * as React from 'react';
import { PageSection, Stack } from '@patternfly/react-core';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import useModelServingEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelServingEnabled';
import OverviewModelsSection from '@odh-dashboard/workbenches/concepts/projects/overviewTab/ServeModels';
import TrainModelsSection from './trainModels/TrainModelsSection';
import ConfigurationSection from './configuration/ConfigurationSection';

const ProjectOverview: React.FC = () => {
  const modelServingEnabled = useModelServingEnabled();

  return (
    <PageSection
      hasBodyWrapper={false}
      isFilled
      aria-label="project-details-page-section"
      id={ProjectSectionID.OVERVIEW}
    >
      <Stack hasGutter data-testid={`section-${ProjectSectionID.OVERVIEW}`}>
        <TrainModelsSection />
        {modelServingEnabled && <OverviewModelsSection />}
        <ConfigurationSection />
      </Stack>
    </PageSection>
  );
};

export default ProjectOverview;
