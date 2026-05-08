import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import type { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectMetricsContextProvider, useProjectMetricsContext } from '../ProjectMetricsContext';

const mockProject: ProjectKind = {
  apiVersion: 'project.openshift.io/v1',
  kind: 'Project',
  metadata: {
    name: 'test-project',
  },
};

describe('ProjectMetricsContext', () => {
  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useProjectMetricsContext())).toThrow(
      /useProjectMetricsContext must be used within a ProjectMetricsContextProvider/,
    );
  });

  it('provides the project metrics context value', () => {
    const inferenceServices = {
      ...DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
      loaded: true,
    };
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <ProjectMetricsContextProvider
        project={mockProject}
        namespace="test-project"
        inferenceServices={inferenceServices}
      >
        {children}
      </ProjectMetricsContextProvider>
    );

    const { result } = renderHook(() => useProjectMetricsContext(), { wrapper });

    expect(result.current.project).toBe(mockProject);
    expect(result.current.namespace).toBe('test-project');
    expect(result.current.inferenceServices).toBe(inferenceServices);
  });
});
