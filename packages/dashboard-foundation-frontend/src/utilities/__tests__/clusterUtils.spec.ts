import { testHook } from '@odh-dashboard/jest-config/hooks';
import { useClusterInfo } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors/clusterInfo';
import { getWindowLocation } from '@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils';
import {
  getOpenShiftConsoleServerURL,
  useOpenShiftURL,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/clusterUtils';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/const', () => ({
  get DEV_MODE() {
    return false;
  },
}));
jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils', () => ({
  getWindowLocation: jest.fn(),
}));

jest.mock('@odh-dashboard/dashboard-foundation-frontend/redux/selectors/clusterInfo', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/redux/selectors/clusterInfo'),
  useClusterInfo: jest.fn(),
}));

const useClusterInfoMock = jest.mocked(useClusterInfo);
const getWindowLocationMock = jest.mocked(getWindowLocation);

const utilitiesConstMock = jest.requireMock<{
  get DEV_MODE(): boolean;
}>('@odh-dashboard/dashboard-foundation-frontend/utilities/const');
const devModeMock = jest.spyOn(utilitiesConstMock, 'DEV_MODE', 'get');

describe('clusterUtils stubs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    devModeMock.mockReset();
    devModeMock.mockReturnValue(false);
    getWindowLocationMock.mockReturnValue({
      hostname: 'localhost',
      protocol: 'http:',
      port: '',
    } as Location);
  });

  describe('getOpenShiftConsoleServerURL', () => {
    it('should construct URL based on window location when no apiURL is provided', () => {
      getWindowLocationMock.mockReturnValue({
        hostname: 'api.example.com',
        protocol: 'https:',
        port: '443',
      } as Location);

      expect(getOpenShiftConsoleServerURL()).toBe(
        'https://console-openshift-console.example.com:443',
      );
    });

    it('should construct URL with DEV_MODE true and provided apiURL', () => {
      getWindowLocationMock.mockReturnValue({
        hostname: 'localhost',
        protocol: 'https:',
        port: '443',
      } as Location);
      devModeMock.mockReturnValue(true);
      const apiURL = 'https://api.example.com:8443';

      expect(getOpenShiftConsoleServerURL(apiURL)).toBe(
        'https://console-openshift-console.apps.example.com',
      );
    });

    it('should return null when hostParts.length is less than 2', () => {
      getWindowLocationMock.mockReturnValue({
        hostname: 'localhost',
        protocol: 'https:',
        port: '443',
      } as Location);

      expect(getOpenShiftConsoleServerURL()).toBeNull();
    });
  });

  describe('useOpenShiftURL', () => {
    it('should return the constructed URL from useClusterInfo', () => {
      getWindowLocationMock.mockReturnValue({
        hostname: 'localhost',
        protocol: 'https:',
        port: '443',
      } as Location);
      devModeMock.mockReturnValue(true);
      const serverURL = 'https://api.example.com';

      useClusterInfoMock.mockReturnValue({ serverURL });

      const result = testHook(useOpenShiftURL)();

      expect(useClusterInfoMock).toHaveBeenCalledTimes(1);
      expect(result).hookToBe('https://console-openshift-console.apps.example.com');
    });

    it('should return null when useClusterInfo returns null', () => {
      getWindowLocationMock.mockReturnValue({
        hostname: 'localhost',
        protocol: 'https:',
        port: '443',
      } as Location);

      useClusterInfoMock.mockReturnValue({ serverURL: undefined });

      const result = testHook(useOpenShiftURL)();

      expect(result).hookToBe(null);
    });
  });
});
