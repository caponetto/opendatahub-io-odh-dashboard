import {
  buildQueryArgumentUrl,
  removeQueryArgument,
  setQueryArgument,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/router';
import { getWindowLocation } from '@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils';

const navigate = jest.fn();
jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils', () => ({
  getWindowLocation: jest.fn(),
}));

const getWindowLocationMock = jest.mocked(getWindowLocation);

function stubLocation(href: string): void {
  const url = new URL(href);
  getWindowLocationMock.mockReturnValue({
    hash: url.hash,
    hostname: url.hostname,
    href: url.toString(),
    origin: url.origin,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    search: url.search,
  } as Location);
}

describe('router window.location stubs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setQueryArgument', () => {
    it('should set a query argument and navigate', () => {
      stubLocation('http://localhost:3000/');

      setQueryArgument(navigate, 'param', 'example');

      expect(navigate).toHaveBeenCalledWith('/?param=example', { replace: true });
    });

    it('should not navigate if query argument is already set to the same value', () => {
      stubLocation('http://localhost:3000/?param=example');

      setQueryArgument(navigate, 'param', 'example');

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('buildQueryArgumentUrl', () => {
    it('should set and preserve hash in generated URL', () => {
      stubLocation('https://example.com/path?foo=bar#hash');

      expect(buildQueryArgumentUrl('project', 'demo')).toBe('/path?foo=bar&project=demo#hash');
    });

    it('should remove a parameter when value is undefined and preserve hash', () => {
      stubLocation('https://example.com/path?foo=bar&project=demo#hash');

      expect(buildQueryArgumentUrl('project')).toBe('/path?foo=bar#hash');
    });

    it('should update an existing parameter and preserve hash', () => {
      stubLocation('https://example.com/path?foo=old#hash');

      expect(buildQueryArgumentUrl('foo', 'new')).toBe('/path?foo=new#hash');
    });

    it('should add a parameter when search is empty and preserve hash', () => {
      stubLocation('https://example.com/path#hash');

      expect(buildQueryArgumentUrl('project', 'demo')).toBe('/path?project=demo#hash');
    });
  });

  describe('removeQueryArgument', () => {
    it('should remove a query argument and navigate', () => {
      stubLocation('http://localhost:3000/?param=example');

      removeQueryArgument(navigate, 'param');

      expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('should not navigate if query argument does not exist', () => {
      stubLocation('http://localhost:3000/');

      removeQueryArgument(navigate, 'nonexistent');

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
