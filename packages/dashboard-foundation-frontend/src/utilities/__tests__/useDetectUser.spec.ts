import { act } from 'react';
import { waitFor, renderHook } from '@testing-library/react';
import { testHook } from '@odh-dashboard/jest-config/hooks';
import axios from '@odh-dashboard/dashboard-foundation-frontend/utilities/axios';
import { StatusResponse } from '@odh-dashboard/dashboard-foundation-frontend/redux/types';
import { useAppDispatch } from '@odh-dashboard/dashboard-foundation-frontend/redux/hooks';
import useDetectUser from '@odh-dashboard/dashboard-foundation-frontend/utilities/useDetectUser';
import {
  getUserFulfilled,
  getUserPending,
  getUserRejected,
} from '@odh-dashboard/dashboard-foundation-frontend/redux/actions/actions';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/axios');

jest.mock('@odh-dashboard/dashboard-foundation-frontend/redux/hooks', () => ({
  useAppDispatch: jest.fn(),
}));

const useAppDispatchMock = jest.mocked(useAppDispatch);
const dispatchMock = jest.fn();

describe('useDetectUser', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    jest.mocked(axios.get).mockReset();
    useAppDispatchMock.mockReset();
  });

  it('should dispatch getUserPending and getUserFulfilled on successful API call', async () => {
    const statusResponseMock: StatusResponse = {
      kube: {
        currentContext: 'myContext',
        currentUser: {
          name: 'john_doe',
          token: 'myAuthToken',
        },
        namespace: 'myNamespace',
        userName: 'John Doe',
        userID: '1234',
        clusterID: 'myClusterID',
        clusterBranding: 'My Cluster',
        isAdmin: true,
        isAllowed: true,
        serverURL: 'https://api.example.com',
        isImpersonating: false,
      },
    };

    jest.mocked(axios.get).mockResolvedValueOnce({ data: statusResponseMock });
    useAppDispatchMock.mockReturnValue(dispatchMock);

    testHook(useDetectUser)();

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(getUserPending());
      expect(dispatchMock).toHaveBeenCalledWith(getUserFulfilled(statusResponseMock));
    });
  });

  it('should dispatch getUserPending and getUserRejected on failed API call', async () => {
    const testError = new Error('Test error');
    jest.mocked(axios.get).mockRejectedValueOnce({
      response: { data: testError },
    });
    useAppDispatchMock.mockReturnValue(dispatchMock);

    testHook(useDetectUser)();

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(getUserPending());
      expect(dispatchMock).toHaveBeenCalledWith(getUserRejected(testError));
    });
  });

  it('should cancel the API call when cancelled is true', async () => {
    jest.mocked(axios.get).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => new Promise(() => {}),
    );
    useAppDispatchMock.mockReturnValue(dispatchMock);

    const { unmount } = renderHook(() => useDetectUser(), { reactStrictMode: false });
    act(() => unmount());

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(getUserPending());
      expect(dispatchMock).not.toHaveBeenCalledWith(getUserRejected(expect.anything()));
    });
  });
});
