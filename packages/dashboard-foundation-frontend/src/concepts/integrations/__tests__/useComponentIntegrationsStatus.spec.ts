import { renderHook } from '@testing-library/react';
import { IntegrationAppStatus } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useComponentIntegrationsStatus } from '@odh-dashboard/dashboard-foundation-frontend/concepts/integrations/useComponentIntegrationsStatus';

// Mock dependencies
jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch');
jest.mock('@odh-dashboard/dashboard-foundation-frontend/services/componentsServices');
jest.mock('@odh-dashboard/dashboard-foundation-frontend/services/integrationAppService');
jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/utils');
jest.mock('@odh-dashboard/dashboard-foundation-frontend/redux/hooks');

const mockUseFetch = jest.requireMock(
  '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch',
).default;
const mockFetchComponents = jest.requireMock(
  '@odh-dashboard/dashboard-foundation-frontend/services/componentsServices',
).fetchComponents;
const mockGetIntegrationAppEnablementStatus = jest.requireMock(
  '@odh-dashboard/dashboard-foundation-frontend/services/integrationAppService',
).getIntegrationAppEnablementStatus;
const mockIsIntegrationApp = jest.requireMock(
  '@odh-dashboard/dashboard-foundation-frontend/utilities/utils',
).isIntegrationApp;
const mockUseAppSelector = jest.requireMock(
  '@odh-dashboard/dashboard-foundation-frontend/redux/hooks',
).useAppSelector;

describe('useComponentIntegrationsStatus', () => {
  const mockIntegrationStatus: IntegrationAppStatus = {
    isEnabled: true,
    isInstalled: true,
    canInstall: true,
    error: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppSelector.mockReturnValue(0);
  });

  it('should return empty object when no integration apps exist', () => {
    mockUseFetch.mockReturnValue({
      data: {},
      loaded: true,
      error: undefined,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useComponentIntegrationsStatus());

    expect(result.current.data).toEqual({});
    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should return integration statuses for valid apps', () => {
    const mockData = {
      app1: mockIntegrationStatus,
      app2: { ...mockIntegrationStatus, isEnabled: false },
    };

    mockUseFetch.mockReturnValue({
      data: mockData,
      loaded: true,
      error: undefined,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useComponentIntegrationsStatus());

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loaded).toBe(true);
  });

  it('should handle fetch errors correctly', () => {
    const mockError = new Error('Fetch failed');
    mockUseFetch.mockReturnValue({
      data: {},
      loaded: false,
      error: mockError,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useComponentIntegrationsStatus());

    expect(result.current.error).toBe(mockError);
    expect(result.current.loaded).toBe(false);
  });

  it('should call useFetch with correct callback', () => {
    const mockComponents = [
      { metadata: { name: 'app1' }, spec: { internalRoute: '/api/app1' } },
      { metadata: { name: 'app2' }, spec: { internalRoute: '/api/app2' } },
    ];

    mockFetchComponents.mockResolvedValue(mockComponents);
    mockIsIntegrationApp.mockReturnValue(true);
    mockGetIntegrationAppEnablementStatus.mockResolvedValue(mockIntegrationStatus);

    mockUseFetch.mockReturnValue({
      data: {},
      loaded: false,
      error: undefined,
      refresh: jest.fn(),
    });

    renderHook(() => useComponentIntegrationsStatus());

    expect(mockUseFetch).toHaveBeenCalledWith(expect.any(Function), {});
  });
});
