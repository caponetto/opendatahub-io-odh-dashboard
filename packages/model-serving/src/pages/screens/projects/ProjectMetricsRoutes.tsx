import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProjectModelMetricsWrapper from './ProjectModelMetricsWrapper';
import ProjectModelMetricsConfigurationPage from './ProjectModelMetricsConfigurationPage';
import ProjectModelMetricsPage from './ProjectModelMetricsPage';
import ProjectInferenceExplainabilityWrapper from './ProjectInferenceExplainabilityWrapper';

export type ProjectMetricsRoutesProps = {
  modelMetricsEnabled: boolean;
  biasMetricsAreaAvailable: boolean;
};

const ProjectMetricsRoutes: React.FC<ProjectMetricsRoutesProps> = ({
  modelMetricsEnabled,
  biasMetricsAreaAvailable,
}) => {
  if (!modelMetricsEnabled) {
    return <Navigate to=".." replace />;
  }

  return (
    <Routes>
      <Route path="model" element={<ProjectInferenceExplainabilityWrapper />}>
        <Route index element={<Navigate to=".." />} />
        <Route path=":inferenceService" element={<ProjectModelMetricsWrapper />}>
          <Route path=":tab?" element={<ProjectModelMetricsPage />} />
          {biasMetricsAreaAvailable && (
            <Route path="configure" element={<ProjectModelMetricsConfigurationPage />} />
          )}
        </Route>
        <Route path="*" element={<Navigate to="." />} />
      </Route>
      <Route path="*" element={<Navigate to=".." />} />
    </Routes>
  );
};

export default ProjectMetricsRoutes;
