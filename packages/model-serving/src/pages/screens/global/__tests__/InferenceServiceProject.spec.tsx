import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockInferenceServiceK8sResource } from '@odh-dashboard/test-mocks/mockInferenceServiceK8sResource';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { mockProjectK8sResource } from '@odh-dashboard/test-mocks/mockProjectK8sResource';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import InferenceServiceProject from '../InferenceServiceProject';

describe('InferenceServiceProject', () => {
  it('should render error if loading fails', () => {
    const result = render(
      <InferenceServiceProject inferenceService={mockInferenceServiceK8sResource({})} />,
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <ProjectsContext.Provider
            value={
              {
                loaded: true,
                loadError: new Error('test loading error'),
              } as React.ComponentProps<typeof ProjectsContext.Provider>['value']
            }
          >
            {children}
          </ProjectsContext.Provider>
        ),
      },
    );

    expect(result.queryByText(/test loading error/)).toBeInTheDocument();
  });

  it('should render kserve project', () => {
    const result = render(
      <InferenceServiceProject
        inferenceService={mockInferenceServiceK8sResource({
          namespace: 'my-project',
        })}
      />,
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <ProjectsContext.Provider
            value={
              {
                loaded: true,
                modelServingProjects: [
                  mockProjectK8sResource({
                    k8sName: 'my-project',
                    displayName: 'My Project',
                  }),
                ],
              } as React.ComponentProps<typeof ProjectsContext.Provider>['value']
            }
          >
            {children}
          </ProjectsContext.Provider>
        ),
      },
    );

    expect(result.queryByText('My Project')).toBeInTheDocument();
    expect(result.queryByText('Single-model serving enabled')).toBeInTheDocument();
  });

  it('should render kserve project', () => {
    const result = render(
      <InferenceServiceProject
        inferenceService={mockInferenceServiceK8sResource({
          namespace: 'my-project',
        })}
      />,
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <ProjectsContext.Provider
            value={
              {
                loaded: true,
                modelServingProjects: [] as ProjectKind[],
              } as React.ComponentProps<typeof ProjectsContext.Provider>['value']
            }
          >
            {children}
          </ProjectsContext.Provider>
        ),
      },
    );

    expect(result.queryByText('My Project')).not.toBeInTheDocument();
    expect(result.queryByText('Unknown')).toBeInTheDocument();
    expect(result.queryByText('Single-model serving enabled')).not.toBeInTheDocument();
    expect(result.queryByText('Multi-model serving enabled')).not.toBeInTheDocument();
  });
});
