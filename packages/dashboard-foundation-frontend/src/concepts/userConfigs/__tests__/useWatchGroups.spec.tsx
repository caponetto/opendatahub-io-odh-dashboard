import { act } from 'react';
import { testHook } from '@odh-dashboard/jest-config/hooks';
import { mockGroup } from '@odh-dashboard/test-mocks/mockGroup';
import { mockAuth } from '@odh-dashboard/test-mocks/mockAuth';
import { getAuth, patchAuth } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/auth';
import { useGroups } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/groups';
import { GroupsConfig } from '@odh-dashboard/dashboard-foundation-frontend/concepts/userConfigs/groupTypes';
import { useWatchGroups } from '@odh-dashboard/dashboard-foundation-frontend/concepts/userConfigs/useWatchGroups';
import useNotification from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNotification';
import { GroupKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { fetchAuthGroups } from '@odh-dashboard/dashboard-foundation-frontend/concepts/userConfigs/utils';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/api/k8s/auth', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/api/k8s/auth'),
  getAuth: jest.fn(),
  patchAuth: jest.fn(),
}));
jest.mock('@odh-dashboard/dashboard-foundation-frontend/api/k8s/groups', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/api/k8s/groups'),
  useGroups: jest.fn(),
}));
jest.mock('@odh-dashboard/dashboard-foundation-frontend/concepts/userConfigs/utils', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/concepts/userConfigs/utils'),
  fetchAuthGroups: jest.fn(),
}));
// Mock the useNotification hook
jest.mock('../../../utilities/useNotification', () => {
  const mock = {
    success: jest.fn(),
    error: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mock),
  };
});
const getAuthMock = jest.mocked(getAuth);
const patchAuthMock = jest.mocked(patchAuth);
const fetchAuthGroupsMock = jest.mocked(fetchAuthGroups);
const useNotificationMock = jest.mocked(useNotification);
const useGroupsMock = jest.mocked(useGroups);
const mockEmptyGroupSettings = {
  adminGroups: [],
  allowedGroups: [],
};

const createResult = (r: Partial<ReturnType<typeof useWatchGroups>>) => ({
  groupSettings: mockEmptyGroupSettings,
  loaded: true,
  isLoading: false,
  isGroupSettingsChanged: false,
  loadError: undefined,
  updateGroups: expect.any(Function),
  setGroupSettings: expect.any(Function),
  setIsGroupSettingsChanged: expect.any(Function),
  ...r,
});

describe('useWatchGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthMock.mockImplementation(() => Promise.resolve(mockAuth()));
    patchAuthMock.mockResolvedValue(mockAuth());
    const groups: GroupKind[] = [mockGroup({ name: 'odh-admins' })];
    useGroupsMock.mockImplementation(() => [groups, true, undefined]);
  });

  it('should fetch groups successfully', async () => {
    const mockGroupSettings: GroupsConfig = {
      adminGroups: [{ id: 'odh-admins', name: 'odh-admins', enabled: true }],
      allowedGroups: [],
    };

    fetchAuthGroupsMock.mockResolvedValue(mockGroupSettings);
    const renderResult = testHook(useWatchGroups)();
    expect(fetchAuthGroupsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(createResult({ loaded: false, isLoading: true }));
    await renderResult.waitForNextUpdate();
    expect(fetchAuthGroupsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(createResult({ groupSettings: mockGroupSettings }));
    renderResult.rerender();
    expect(renderResult).hookToBeStable({
      groupSettings: true,
      loaded: true,
      isLoading: true,
      isGroupSettingsChanged: true,
      loadError: true,
      updateGroups: true,
      setGroupSettings: true,
      setIsGroupSettingsChanged: true,
    });

    const mockUpdatedGroupSettings: GroupsConfig = {
      adminGroups: [{ id: 'odh-admins', name: 'odh-admins', enabled: true }],
      allowedGroups: [
        { id: 'odh-admins', name: 'odh-admins', enabled: false },
        { id: 'system:authenticated', name: 'system:authenticated', enabled: true },
      ],
    };
    act(() => {
      renderResult.result.current.setIsGroupSettingsChanged(true);
    });
    expect(renderResult).hookToStrictEqual(
      createResult({ groupSettings: mockGroupSettings, isGroupSettingsChanged: true }),
    );
    act(() => {
      renderResult.result.current.updateGroups(mockUpdatedGroupSettings);
    });
    expect(renderResult).hookToStrictEqual(
      createResult({
        groupSettings: mockGroupSettings,
        isLoading: true,
        isGroupSettingsChanged: true,
      }),
    );
    await renderResult.waitForNextUpdate();
    expect(renderResult).hookToStrictEqual(
      createResult({ groupSettings: mockUpdatedGroupSettings }),
    );
  });

  it('should handle error', async () => {
    fetchAuthGroupsMock.mockRejectedValue(new Error(`Error getting group settings`));
    const renderResult = testHook(useWatchGroups)();
    expect(fetchAuthGroupsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(createResult({ loaded: false, isLoading: true }));
    await renderResult.waitForNextUpdate();
    expect(fetchAuthGroupsMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(
      createResult({ loaded: false, loadError: new Error('Error getting group settings') }),
    );
    expect(useNotificationMock().error).toHaveBeenCalledWith(
      'Error',
      'Error getting group settings',
    );
  });
});
