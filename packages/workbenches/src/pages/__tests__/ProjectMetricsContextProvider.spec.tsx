import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import type { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useProjectMetricsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectMetricsContext';
import useInferenceServices from '@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices';
import useSyncPreferredProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject';
import ProjectMetricsContextProvider from '../ProjectMetricsContextProvider';

jest.mock('@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock(
  '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

const useInferenceServicesMock = jest.mocked(useInferenceServices);
const useSyncPreferredProjectMock = jest.mocked(useSyncPreferredProject);

const mockProject: ProjectKind = {
  apiVersion: 'project.openshift.io/v1',
  kind: 'Project',
  metadata: {
    name: 'test-project',
  },
};

const TestChild: React.FC = () => {
  const { project, namespace, inferenceServices } = useProjectMetricsContext();
  return (
    <div data-testid="project-metrics-context">
      {project.metadata.name}:{namespace}:{inferenceServices.loaded ? 'loaded' : 'loading'}
    </div>
  );
};

describe('ProjectMetricsContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInferenceServicesMock.mockReturnValue({
      ...DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
      loaded: true,
    });
  });

  it('provides the selected project and inference services to the metrics subtree', () => {
    render(
      <ProjectsContext.Provider
        value={{
          projects: [mockProject],
          modelServingProjects: [mockProject],
          nonActiveProjects: [],
          preferredProject: null,
          updatePreferredProject: jest.fn(),
          waitForProject: jest.fn().mockResolvedValue(undefined),
          loaded: true,
          loadError: undefined,
        }}
      >
        <MemoryRouter initialEntries={['/projects/test-project/metrics/model/test-model']}>
          <Routes>
            <Route
              path="/projects/:namespace/metrics/*"
              element={<ProjectMetricsContextProvider />}
            >
              <Route path="model/:inferenceService" element={<TestChild />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ProjectsContext.Provider>,
    );

    expect(screen.getByTestId('project-metrics-context')).toHaveTextContent(
      'test-project:test-project:loaded',
    );
    expect(useSyncPreferredProjectMock).toHaveBeenCalledWith(mockProject);
    expect(useInferenceServicesMock).toHaveBeenCalledWith(
      'test-project',
      undefined,
      undefined,
      undefined,
      expect.objectContaining({
        refreshRate: expect.any(Number),
      }),
    );
  });
});
