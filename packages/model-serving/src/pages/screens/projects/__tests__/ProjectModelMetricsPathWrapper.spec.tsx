import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import type {
  InferenceServiceKind,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectMetricsContextProvider } from '@odh-dashboard/projects-shared/concepts/projects/ProjectMetricsContext';
import ProjectModelMetricsPathWrapper from '../ProjectModelMetricsPathWrapper';

const mockProject: ProjectKind = {
  apiVersion: 'project.openshift.io/v1',
  kind: 'Project',
  metadata: {
    name: 'test-project',
  },
};

const mockModel: InferenceServiceKind = {
  apiVersion: 'serving.kserve.io/v1beta1',
  kind: 'InferenceService',
  metadata: {
    name: 'test-model',
    namespace: 'test-project',
  },
  spec: {
    predictor: {},
  },
};

describe('ProjectModelMetricsPathWrapper', () => {
  it('resolves the selected model from the project metrics context', () => {
    render(
      <MemoryRouter initialEntries={['/projects/test-project/metrics/model/test-model']}>
        <ProjectMetricsContextProvider
          project={mockProject}
          namespace="test-project"
          inferenceServices={{
            ...DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
            data: { items: [mockModel], hasNonDashboardItems: false },
            loaded: true,
          }}
        >
          <Routes>
            <Route
              path="/projects/:namespace/metrics/model/:inferenceService"
              element={
                <ProjectModelMetricsPathWrapper>
                  {(model, currentProject) => (
                    <div data-testid="resolved-model">
                      {currentProject.metadata.name}:{model.metadata.name}
                    </div>
                  )}
                </ProjectModelMetricsPathWrapper>
              }
            />
          </Routes>
        </ProjectMetricsContextProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('resolved-model')).toHaveTextContent('test-project:test-model');
  });
});
