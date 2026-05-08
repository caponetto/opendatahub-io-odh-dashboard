import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { MetricsCommonContextProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/MetricsCommonContext';
import ModelMetricsPathWrapper from './ModelMetricsPathWrapper';
import { ModelServingMetricsProvider } from './ModelServingMetricsContext';
import { getModelMetricsQueries } from './utils';
import { PerformanceMetricType } from '../types';

export type GlobalModelMetricsOutletContextProps = {
  model: InferenceServiceKind;
  projectName: string;
};

const GlobalModelMetricsWrapper: React.FC = () => (
  <ModelMetricsPathWrapper>
    {(model, projectName) => {
      const queries = getModelMetricsQueries(model);
      return (
        <MetricsCommonContextProvider>
          <ModelServingMetricsProvider
            queries={queries}
            type={PerformanceMetricType.MODEL}
            namespace={projectName}
          >
            <Outlet context={{ model, projectName }} />
          </ModelServingMetricsProvider>
        </MetricsCommonContextProvider>
      );
    }}
  </ModelMetricsPathWrapper>
);

export default GlobalModelMetricsWrapper;
