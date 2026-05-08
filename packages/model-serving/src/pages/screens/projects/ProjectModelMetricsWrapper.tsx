import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { MetricsCommonContextProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/MetricsCommonContext';
import {
  InferenceServiceKind,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import ProjectModelMetricsPathWrapper from './ProjectModelMetricsPathWrapper';
import { ModelServingMetricsProvider } from '../metrics/ModelServingMetricsContext';
import { getModelMetricsQueries } from '../metrics/utils';
import { PerformanceMetricType } from '../types';

export type ProjectModelMetricsOutletContextProps = {
  model: InferenceServiceKind;
  currentProject: ProjectKind;
};

const ProjectModelMetricsWrapper: React.FC = () => (
  <ProjectModelMetricsPathWrapper>
    {(model, currentProject) => {
      const queries = getModelMetricsQueries(model);
      return (
        <MetricsCommonContextProvider>
          <ModelServingMetricsProvider
            queries={queries}
            type={PerformanceMetricType.MODEL}
            namespace={currentProject.metadata.name}
          >
            <Outlet context={{ model, currentProject }} />
          </ModelServingMetricsProvider>
        </MetricsCommonContextProvider>
      );
    }}
  </ProjectModelMetricsPathWrapper>
);

export default ProjectModelMetricsWrapper;
