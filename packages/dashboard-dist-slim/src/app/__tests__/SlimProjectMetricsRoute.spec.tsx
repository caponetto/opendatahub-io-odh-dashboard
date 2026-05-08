import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import type { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useInferenceServices from '@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices';
import useModelMetricsEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelMetricsEnabled';
import useSyncPreferredProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject';
import { useIsAreaAvailable } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import SlimProjectMetricsRoute from '../SlimProjectMetricsRoute';

const mockProjectMetricsRoutes = jest.fn<
  React.ReactElement,
  [{ modelMetricsEnabled: boolean; biasMetricsAreaAvailable: boolean }]
>();

jest.mock('@odh-dashboard/plugin-core', () => ({
  ...jest.requireActual('@odh-dashboard/plugin-core'),
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@odh-dashboard/model-serving-shared/concepts/modelServing/useInferenceServices', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock(
  '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelMetricsEnabled',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

jest.mock(
  '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/useSyncPreferredProject',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

jest.mock('@odh-dashboard/dashboard-foundation-frontend/concepts/areas', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/concepts/areas'),
  useIsAreaAvailable: jest.fn(),
}));

const useResolvedExtensionsMock = jest.mocked(useResolvedExtensions);
const useInferenceServicesMock = jest.mocked(useInferenceServices);
const useModelMetricsEnabledMock = jest.mocked(useModelMetricsEnabled);
const useSyncPreferredProjectMock = jest.mocked(useSyncPreferredProject);
const useIsAreaAvailableMock = jest.mocked(useIsAreaAvailable);

const mockProject: ProjectKind = {
  apiVersion: 'project.openshift.io/v1',
  kind: 'Project',
  metadata: {
    name: 'test-project',
  },
};

describe('SlimProjectMetricsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          type: 'model-serving.metrics/routes',
          uid: 'test-uid',
          pluginID: 'test',
          pluginName: 'test',
          properties: {
            Component: {
              default: (props: {
                modelMetricsEnabled: boolean;
                biasMetricsAreaAvailable: boolean;
              }) => {
                mockProjectMetricsRoutes(props);
                return <div data-testid="project-metrics-routes" />;
              },
            },
          },
        },
      ],
      true,
      [],
    ] as never);
    useInferenceServicesMock.mockReturnValue({
      ...DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
      loaded: true,
    });
    useModelMetricsEnabledMock.mockReturnValue([true]);
    useIsAreaAvailableMock.mockReturnValue({ status: true } as ReturnType<
      typeof useIsAreaAvailable
    >);
  });

  it('hosts the shared project metrics routes for the selected project', () => {
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
            <Route path="/projects/:namespace/metrics/*" element={<SlimProjectMetricsRoute />} />
          </Routes>
        </MemoryRouter>
      </ProjectsContext.Provider>,
    );

    expect(screen.getByTestId('project-metrics-routes')).not.toBeNull();
    expect(mockProjectMetricsRoutes).toHaveBeenCalledWith({
      modelMetricsEnabled: true,
      biasMetricsAreaAvailable: true,
    });
    expect(useSyncPreferredProjectMock).toHaveBeenCalledWith(mockProject);
  });

  it('redirects to the slim model serving page when no projects are available', () => {
    render(
      <ProjectsContext.Provider
        value={{
          projects: [],
          modelServingProjects: [],
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
            <Route path="/projects/:namespace/metrics/*" element={<SlimProjectMetricsRoute />} />
            <Route path="/model-serving" element={<div data-testid="model-serving-home" />} />
          </Routes>
        </MemoryRouter>
      </ProjectsContext.Provider>,
    );

    expect(screen.getByTestId('model-serving-home')).not.toBeNull();
  });
});
