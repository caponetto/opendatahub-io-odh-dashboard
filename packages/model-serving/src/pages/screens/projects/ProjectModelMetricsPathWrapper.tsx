import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import NotFound from '@odh-dashboard/dashboard-foundation-frontend/pages/NotFound';
import {
  InferenceServiceKind,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useProjectMetricsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectMetricsContext';

type ProjectModelMetricsPathWrapperProps = {
  children: (
    inferenceService: InferenceServiceKind,
    currentProject: ProjectKind,
  ) => React.ReactNode;
};

const ProjectModelMetricsPathWrapper: React.FC<ProjectModelMetricsPathWrapperProps> = ({
  children,
}) => {
  const { inferenceService: modelName } = useParams<{
    inferenceService: string;
  }>();
  const {
    project,
    inferenceServices: {
      data: { items: models },
      loaded,
    },
  } = useProjectMetricsContext();
  const model = models.find((currentModel) => currentModel.metadata.name === modelName);
  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (!model) {
    return <NotFound />;
  }

  return <>{children(model, project)}</>;
};

export default ProjectModelMetricsPathWrapper;
