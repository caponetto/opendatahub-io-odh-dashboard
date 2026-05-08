import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import NotFound from '@odh-dashboard/dashboard-foundation-frontend/pages/NotFound';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ModelServingContext } from '../../ModelServingContext';

type ModelMetricsPathWrapperProps = {
  children: (inferenceService: InferenceServiceKind, projectName: string) => React.ReactNode;
};

const ModelMetricsPathWrapper: React.FC<ModelMetricsPathWrapperProps> = ({ children }) => {
  const { namespace: projectName, inferenceService: modelName } = useParams<{
    namespace: string;
    inferenceService: string;
  }>();
  const {
    inferenceServices: {
      data: { items: models },
      loaded,
    },
  } = React.useContext(ModelServingContext);
  const inferenceService = models.find(
    (model) => model.metadata.name === modelName && model.metadata.namespace === projectName,
  );
  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (!inferenceService || !projectName) {
    return <NotFound />;
  }

  return <>{children(inferenceService, projectName)}</>;
};

export default ModelMetricsPathWrapper;
