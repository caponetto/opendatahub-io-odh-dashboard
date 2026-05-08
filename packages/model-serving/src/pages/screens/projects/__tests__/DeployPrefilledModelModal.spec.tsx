import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeployPrefilledModelModal from '../DeployPrefilledModelModal';
import { ModelServingContext } from '../../../ModelServingContext';

jest.mock('../../../ModelServingContext', () => {
  const actual = jest.requireActual('../../../ModelServingContext');
  return {
    ...actual,
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('../../../useServingPlatformStatuses', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('../utils', () => ({
  getProjectModelServingPlatform: () => ({ platform: null, error: undefined }),
}));

jest.mock(
  '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useServingConnections',
  () => ({
    __esModule: true,
    default: () => [[], true, undefined],
  }),
);

jest.mock('../../../utils', () => ({
  isOciModelUri: () => false,
}));

jest.mock('../InferenceServiceModal/ProjectSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="project-selector" />,
}));

const mockContextValue = {
  refreshAllData: jest.fn(),
  filterTokens: jest.fn().mockReturnValue([]),
  servingRuntimes: { data: [], loaded: true, error: undefined, refresh: jest.fn() },
  servingRuntimeTemplates: [[], true, undefined] as [never[], boolean, undefined],
  servingRuntimeTemplateOrder: { data: [], loaded: true, error: undefined, refresh: jest.fn() },
  servingRuntimeTemplateDisablement: {
    data: [],
    loaded: true,
    error: undefined,
    refresh: jest.fn(),
  },
  inferenceServices: { data: [], loaded: true, error: undefined, refresh: jest.fn() },
  dataConnections: { data: [], loaded: true, error: undefined, refresh: jest.fn() },
  serverSecrets: { data: [], loaded: true, error: undefined, refresh: jest.fn() },
  currentProject: undefined,
} as unknown as React.ContextType<typeof ModelServingContext>;

describe('DeployPrefilledModelModal', () => {
  it('renders ContentModal with Deploy button disabled when no project selected', () => {
    render(
      <ModelServingContext.Provider value={mockContextValue}>
        <DeployPrefilledModelModal
          modelDeployPrefillInfo={{
            modelName: 'test-model',
            modelFormat: 'onnx',
            modelArtifactUri: 'https://example.com/model.zip',
          }}
          prefillInfoLoaded
          onCancel={jest.fn()}
        />
      </ModelServingContext.Provider>,
    );

    expect(screen.getByText('Deploy model')).toBeInTheDocument();
    expect(screen.getByText('Configure properties for deploying your model')).toBeInTheDocument();
    expect(screen.getByTestId('deploy-button')).toBeDisabled();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <ModelServingContext.Provider value={mockContextValue}>
        <DeployPrefilledModelModal
          modelDeployPrefillInfo={{
            modelName: 'test-model',
          }}
          prefillInfoLoaded
          onCancel={onCancel}
        />
      </ModelServingContext.Provider>,
    );

    screen.getByTestId('cancel-button').click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows spinner when not loaded', () => {
    render(
      <ModelServingContext.Provider
        value={
          {
            ...mockContextValue,
            servingRuntimeTemplates: [[], false, undefined],
          } as unknown as React.ContextType<typeof ModelServingContext>
        }
      >
        <DeployPrefilledModelModal
          modelDeployPrefillInfo={{
            modelName: 'test-model',
          }}
          prefillInfoLoaded={false}
          onCancel={jest.fn()}
        />
      </ModelServingContext.Provider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
