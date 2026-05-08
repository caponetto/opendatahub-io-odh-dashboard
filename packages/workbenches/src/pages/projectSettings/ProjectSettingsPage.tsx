import React, { ReactElement } from 'react';
import { PageSection, Stack, StackItem } from '@patternfly/react-core';
import { LazyCodeRefComponent, useExtensions } from '@odh-dashboard/plugin-core';
import { isProjectSettingsCard } from '@odh-dashboard/plugin-core/extension-points';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';

const ProjectSettingsPage = (): ReactElement => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const settingsCardExtensions = useExtensions(isProjectSettingsCard);

  return (
    <PageSection
      hasBodyWrapper={false}
      isFilled
      aria-label="project-settings-page-section"
      id={ProjectSectionID.SETTINGS}
    >
      <Stack hasGutter>
        {settingsCardExtensions.map((ext) => (
          <StackItem key={ext.properties.id}>
            <LazyCodeRefComponent
              component={ext.properties.component}
              props={{ project: currentProject }}
            />
          </StackItem>
        ))}
      </Stack>
    </PageSection>
  );
};

export default ProjectSettingsPage;
