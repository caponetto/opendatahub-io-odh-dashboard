import { act, renderHook, waitFor } from '@testing-library/react';
import { DASHBOARD_NAMESPACE_TIMEOUT_MS } from '../DashboardNamespaceContext';
import { useAppBootstrap, type AppBootstrap } from '../useAppBootstrap';

const SERVING_GROUP_URL = '/api/k8s/apis/serving.kserve.io';
const SERVING_RESOURCES_URL = '/api/k8s/apis/serving.kserve.io/v1alpha2';

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body } as Response);

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: async () => ({}) } as Response);

const toUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

const routes: Record<string, Response> = {
  '/api/status': jsonResponse({
    kube: { namespace: 'rhaii-operator', userName: 'dev@redhat.com' },
  }),
  [SERVING_GROUP_URL]: jsonResponse({ versions: [{ groupVersion: 'serving.kserve.io/v1alpha2' }] }),
  [SERVING_RESOURCES_URL]: jsonResponse({
    resources: [{ name: 'llminferenceservices' }, { name: 'inferenceservices' }],
  }),
};

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((input) => {
    const url = toUrl(input);
    if (!Object.hasOwn(routes, url)) {
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    }
    return Promise.resolve(routes[url]);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('useAppBootstrap', () => {
  it('should resolve the state from both fetches', async () => {
    const { result } = renderHook(useAppBootstrap);

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(result.current.error).toBeNull();
    expect(result.current.state).toEqual({
      namespace: 'rhaii-operator',
      userName: 'dev@redhat.com',
      capabilities: { llmdServing: true, kServe: true },
    });
  });

  it('should set the error and keep the state unset on failure', async () => {
    fetchMock.mockImplementation((input) =>
      toUrl(input) === '/api/status'
        ? Promise.resolve(errorResponse(500))
        : Promise.resolve(routes[toUrl(input)]),
    );

    const { result } = renderHook(useAppBootstrap);

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toEqual(new Error('Unable to load the server status (HTTP 500).'));
    expect(result.current.state).toBeNull();
  });

  it('should map an abort to a timeout message', async () => {
    fetchMock.mockImplementation(() =>
      Promise.reject(new DOMException('The operation was aborted', 'AbortError')),
    );

    const { result } = renderHook(useAppBootstrap);

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toEqual(new Error('The server did not respond in time.'));
  });

  it('should wrap a non-Error rejection', async () => {
    fetchMock.mockImplementation(() => Promise.reject('gateway closed'));

    const { result } = renderHook(useAppBootstrap);

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toEqual(new Error('Bootstrap failed.'));
  });

  it('should share one abort signal between both fetches', () => {
    renderHook(useAppBootstrap);

    const signals = fetchMock.mock.calls.map(([, options]) => options?.signal);
    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(signals[1]);
  });

  it('should reload and clear the error', async () => {
    let status = errorResponse(503);
    fetchMock.mockImplementation((input) =>
      toUrl(input) === '/api/status'
        ? Promise.resolve(status)
        : Promise.resolve(routes[toUrl(input)]),
    );

    const { result } = renderHook(useAppBootstrap);
    await waitFor(() => expect(result.current.error).not.toBeNull());

    status = jsonResponse({ kube: { namespace: 'rhaii-operator' } });
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(result.current.error).toBeNull();
    // The whole bootstrap re-fetched, not just the failed route.
    expect(fetchMock.mock.calls.filter((c) => toUrl(c[0]) === '/api/status')).toHaveLength(2);
  });

  it('should abort both fetches when the timeout fires', async () => {
    jest.useFakeTimers();
    try {
      // Reject each fetch when its shared signal aborts, like a real transport.
      fetchMock.mockImplementation(
        (_input, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted', 'AbortError')),
            );
          }),
      );

      const { result } = renderHook(useAppBootstrap);

      act(() => {
        jest.advanceTimersByTime(DASHBOARD_NAMESPACE_TIMEOUT_MS);
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toEqual(new Error('The server did not respond in time.'));
    } finally {
      jest.useRealTimers();
    }
  });

  it('should ignore a resolution that lands after unmount', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    let resolveStatus: (value: Response) => void = () => undefined;
    fetchMock.mockImplementation((input) => {
      if (toUrl(input) === '/api/status') {
        return new Promise((resolve) => {
          resolveStatus = resolve;
        });
      }
      return Promise.resolve(routes[toUrl(input)]);
    });

    const { result, unmount } = renderHook(useAppBootstrap);
    const before: AppBootstrap = result.current;
    unmount();

    await act(async () => {
      resolveStatus(jsonResponse({ kube: { namespace: 'late' } }));
    });

    // No state update, and no act warning from the late resolution.
    expect(result.current).toBe(before);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
