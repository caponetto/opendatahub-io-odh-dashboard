import { testHook } from '@odh-dashboard/jest-config/hooks';
import { getAllowedUsers } from '@odh-dashboard/dashboard-foundation-frontend/redux/actions/actions';
import { mockAllowedUsers } from '@odh-dashboard/test-mocks/mockAllowedUsers';
import type { AllowedUser } from '@odh-dashboard/dashboard-foundation-frontend/types/allowedUser';
import useCheckForAllowedUsers from '../useCheckForAllowedUsers';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/redux/actions/actions', () => ({
  getAllowedUsers: jest.fn(),
}));

jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/useNamespaces', () => () => ({
  workbenchNamespace: 'test-project',
  dashboardNamespace: 'opendatahub',
}));

const getAllowedUsersMock = jest.mocked(getAllowedUsers);

describe('useCheckForAllowedUsers', () => {
  beforeEach(jest.clearAllMocks);

  it('should return list of users', async () => {
    const mockAllowedUser: AllowedUser = mockAllowedUsers({});
    getAllowedUsersMock.mockResolvedValue([mockAllowedUser]);
    const renderResult = testHook(useCheckForAllowedUsers)();

    expect(getAllowedUsersMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual([[], false, undefined]);
    expect(renderResult).hookToHaveUpdateCount(1);

    await renderResult.waitForNextUpdate();
    expect(getAllowedUsersMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual([[mockAllowedUser], true, undefined]);
    expect(renderResult).hookToHaveUpdateCount(2);
  });

  it('should handle error', async () => {
    const error = (message: string) => ({
      response: {
        data: {
          message,
        },
      },
    });
    getAllowedUsersMock.mockRejectedValue(error('error1'));
    const renderResult = testHook(useCheckForAllowedUsers)();

    expect(getAllowedUsersMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual([[], false, undefined]);
    expect(renderResult).hookToHaveUpdateCount(1);

    await renderResult.waitForNextUpdate();
    expect(getAllowedUsersMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual([[], false, new Error('error1')]);
    expect(renderResult).hookToHaveUpdateCount(2);
  });

  it('should handle error without response (network error)', async () => {
    getAllowedUsersMock.mockRejectedValue(new Error('Network Error'));
    const renderResult = testHook(useCheckForAllowedUsers)();

    expect(renderResult).hookToStrictEqual([[], false, undefined]);
    expect(renderResult).hookToHaveUpdateCount(1);

    await renderResult.waitForNextUpdate();
    expect(renderResult).hookToStrictEqual([[], false, new Error('Network Error')]);
    expect(renderResult).hookToHaveUpdateCount(2);
  });
});
