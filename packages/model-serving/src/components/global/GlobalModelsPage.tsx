import React from 'react';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { LazyCodeRefComponent, useExtensions } from '@odh-dashboard/plugin-core';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useNavigate, useParams } from 'react-router-dom';
import { isModelServingPlatformExtension } from '@odh-dashboard/model-serving-shared/extension-points';
import GlobalDeploymentsView from './GlobalDeploymentsView';
import { getGlobalDeploymentsPath } from './globalRouteUtils';
import { ModelDeploymentsProvider } from '../../concepts/ModelDeploymentsContext';
import { getMultiProjectServingPlatforms } from '../../concepts/useProjectServingPlatform';

const GlobalModelsPage: React.FC = () => {
  const availablePlatforms = useExtensions(isModelServingPlatformExtension);

  const { projects, loaded: projectsLoaded, preferredProject } = React.useContext(ProjectsContext);

  const { namespace } = useParams();
  const navigate = useNavigate();

  const projectsToShow = React.useMemo(() => {
    if (preferredProject) {
      return [preferredProject];
    }
    if (namespace) {
      return projects.filter((project) => project.metadata.name === namespace);
    }
    return projects;
  }, [preferredProject, projects, namespace]);

  React.useEffect(() => {
    if (!namespace && preferredProject) {
      navigate(getGlobalDeploymentsPath(preferredProject.metadata.name), {
        replace: true,
      });
    }
  }, [namespace, preferredProject, navigate]);

  const BackportPageComponent = React.useMemo(() => {
    const platforms = getMultiProjectServingPlatforms(projectsToShow, availablePlatforms);
    return platforms.find((p) => p.properties.backport?.GlobalModelsPage)?.properties.backport
      ?.GlobalModelsPage;
  }, [projectsToShow, availablePlatforms]);

  if (BackportPageComponent) {
    return (
      <LazyCodeRefComponent
        component={BackportPageComponent}
        fallback={
          <Bullseye>
            <Spinner />
          </Bullseye>
        }
      />
    );
  }

  return (
    <ModelDeploymentsProvider projects={projectsToShow}>
      <GlobalDeploymentsView projects={projectsToShow} projectsLoaded={projectsLoaded} />
    </ModelDeploymentsProvider>
  );
};

export default GlobalModelsPage;
