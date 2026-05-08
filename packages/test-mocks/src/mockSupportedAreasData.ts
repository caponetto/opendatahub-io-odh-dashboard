import {
  SupportedAreasStateMap,
  SupportedAreasState,
  IsAreaAvailableOptions,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { mockDashboardConfig } from '@odh-dashboard/test-mocks/mockDashboardConfig.ts';

export const mockSupportedAreasStateMap = (
  overrides: SupportedAreasState = {},
): SupportedAreasState => ({
  ...SupportedAreasStateMap,
  ...overrides,
});

export const mockIsAreaAvailableOptions = (overrides: {
  stateMapOverrides?: SupportedAreasState;
  dashboardConfigOverrides?: Parameters<typeof mockDashboardConfig>[0];
}): IsAreaAvailableOptions => ({
  internalStateMap: mockSupportedAreasStateMap(overrides.stateMapOverrides ?? {}),
  flagState: mockDashboardConfig(overrides.dashboardConfigOverrides ?? {}).spec.dashboardConfig,
});
