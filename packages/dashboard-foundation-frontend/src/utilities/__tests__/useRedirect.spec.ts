import { testHook } from '@odh-dashboard/jest-config/hooks';
import { useRedirect } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useRedirect';
import {
  assignWindowLocation,
  getWindowLocation,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils';

const mockNavigate = jest.fn();
const mockAssign = jest.fn<void, [string]>();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
jest.mock('@odh-dashboard/dashboard-foundation-frontend/utilities/windowUtils', () => ({
  assignWindowLocation: jest.fn(),
  getWindowLocation: jest.fn(),
}));

const assignWindowLocationMock = jest.mocked(assignWindowLocation);
const getWindowLocationMock = jest.mocked(getWindowLocation);

describe('useRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assignWindowLocationMock.mockImplementation(mockAssign);
    getWindowLocationMock.mockReturnValue({
      hash: '',
      hostname: 'localhost',
      href: 'http://localhost/',
      origin: 'http://localhost',
      pathname: '/',
      port: '',
      protocol: 'http:',
      search: '',
    } as Location);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle successful redirect', async () => {
    const createRedirectPath = jest.fn().mockReturnValue('/success-path');
    const onComplete = jest.fn();
    const renderResult = testHook(useRedirect)(createRedirectPath, { onComplete });

    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(createRedirectPath).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/success-path', undefined);
    expect(onComplete).toHaveBeenCalled();
    expect(state.loaded).toBe(true);
    expect(state.error).toBeUndefined();
  });

  it('should handle async redirect path creation', async () => {
    const createRedirectPath = jest.fn().mockResolvedValue('/async-path');
    const renderResult = testHook(useRedirect)(createRedirectPath);

    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(createRedirectPath).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/async-path', undefined);
    expect(state.loaded).toBe(true);
    expect(state.error).toBeUndefined();
  });

  it('should handle redirect with navigation options', async () => {
    const createRedirectPath = jest.fn().mockReturnValue('/path');
    const navigateOptions = { replace: true };
    const renderResult = testHook(useRedirect)(createRedirectPath, { navigateOptions });
    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(mockNavigate).toHaveBeenCalledWith('/path', navigateOptions);
  });

  it('should handle URL object redirect for same-origin paths', async () => {
    const createRedirectPath = jest
      .fn()
      .mockReturnValue(new URL('/same-origin?x=1#abc', 'http://localhost'));
    const renderResult = testHook(useRedirect)(createRedirectPath);

    await renderResult.waitForNextUpdate();

    expect(mockNavigate).toHaveBeenCalledWith('/same-origin?x=1#abc', undefined);
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it('should use window.location.assign for external redirects', async () => {
    const createRedirectPath = jest.fn().mockReturnValue('https://example.com/docs');
    const renderResult = testHook(useRedirect)(createRedirectPath);

    await renderResult.waitForNextUpdate();

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(assignWindowLocationMock).toHaveBeenCalledWith('https://example.com/docs');
  });

  it('should handle error when path is undefined', async () => {
    const createRedirectPath = jest.fn().mockRejectedValue(new Error('No path available'));
    const onError = jest.fn();
    const renderResult = testHook(useRedirect)(createRedirectPath, { onError });

    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(state.loaded).toBe(true);
    expect(state.error).toBeInstanceOf(Error);
  });

  it('should handle error in path creation', async () => {
    const error = new Error('Failed to create path');
    const createRedirectPath = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();
    const renderResult = testHook(useRedirect)(createRedirectPath, { onError });

    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(onError).toHaveBeenCalledWith(error);
    expect(state.loaded).toBe(true);
    expect(state.error).toBe(error);
  });

  it('should not redirect to not-found when notFoundOnError is false', async () => {
    const createRedirectPath = jest.fn().mockRejectedValue(new Error('redirect failed'));
    const renderResult = testHook(useRedirect)(createRedirectPath);

    let state = renderResult.result.current;
    expect(state.loaded).toBe(false);
    expect(state.error).toBeUndefined();

    await renderResult.waitForNextUpdate();
    state = renderResult.result.current;

    expect(mockNavigate).not.toHaveBeenCalled();

    expect(state.loaded).toBe(true);
    expect(state.error).toBeInstanceOf(Error);
  });

  it('should be stable', () => {
    const createRedirectPath = jest.fn().mockReturnValue('/path');
    const renderResult = testHook(useRedirect)(createRedirectPath);
    renderResult.rerender(createRedirectPath);
    expect(renderResult).hookToBeStable({ loaded: true, error: undefined });
    expect(renderResult).hookToHaveUpdateCount(3);
  });
});
