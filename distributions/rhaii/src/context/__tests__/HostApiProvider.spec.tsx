import React, { type PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import { useAccessReview, useHostApi, useHostApiCore } from '@odh-dashboard/plugin-core/host-api';
import { useTrackEvent, useTrackPageEvent } from '@odh-dashboard/analytics/react';
import type { AccessReviewResourceAttributes, ProjectKind } from '@odh-dashboard/k8s-core';
import { NamespaceApplicationCase } from '@odh-dashboard/k8s-core';
import HostApiProvider from '../HostApiProvider';
import { k8sFetch } from '../k8sFetch';

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const reviewUrl = '/api/k8s/apis/authorization.k8s.io/v1/selfsubjectaccessreviews';

// The SDK parses text; transport errors parse JSON. Neither path needs a browser Response body.
const response = (body: unknown, status = 201): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response);

const llmAttributes: AccessReviewResourceAttributes = {
  group: 'serving.kserve.io',
  resource: 'llminferenceservices',
  verb: 'create',
  namespace: 'model-project',
};

beforeAll(() => {
  setUtilsConfig({
    appFetch: k8sFetch,
    wsAppSettings: async () => ({ host: 'ws://localhost', subProtocols: [] }),
  });
});

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe('RHAII host access reviews through the Kubernetes transport', () => {
  it.each<AccessReviewResourceAttributes>([
    llmAttributes,
    { ...llmAttributes, verb: 'list' },
    { ...llmAttributes, verb: 'get', name: 'model' },
    { ...llmAttributes, verb: 'delete', name: 'model' },
    { group: '', resource: 'secrets', verb: 'create', namespace: 'model-project' },
    { group: '', resource: 'secrets', verb: 'get', namespace: 'model-project', name: 'connection' },
    {
      group: 'rbac.authorization.k8s.io',
      resource: 'rolebindings',
      verb: 'create',
      namespace: 'model-project',
    },
    { group: 'kueue.x-k8s.io', resource: 'clusterqueues', verb: 'get' },
  ])('should review only the requested caller permission: %j', async (attributes) => {
    fetchMock.mockResolvedValue(response({ status: { allowed: true } }));
    const { result } = renderHook(() => useAccessReview(attributes), { wrapper: HostApiProvider });

    expect(result.current).toEqual([false, false]);
    await waitFor(() => expect(result.current).toEqual([true, true]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      reviewUrl,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectAccessReview',
          spec: {
            resourceAttributes: {
              group: attributes.group ?? '',
              resource: attributes.resource ?? '',
              subresource: attributes.subresource ?? '',
              verb: attributes.verb,
              name: attributes.name ?? '',
              namespace: attributes.namespace ?? '',
            },
          },
        }),
      }),
    );
    // Authentication is supplied by the existing same-origin transport, not synthetic subjects.
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json',
    });
  });

  it('should preserve an explicit denial', async () => {
    fetchMock.mockResolvedValue(response({ status: { allowed: false } }));
    const { result } = renderHook(() => useAccessReview(llmAttributes), {
      wrapper: HostApiProvider,
    });
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });

  it.each([401, 403, 404, 500])(
    'should deny an HTTP %s response even if its body contains an approval',
    async (status) => {
      fetchMock.mockResolvedValue(response({ status: { allowed: true } }, status));
      const { result } = renderHook(() => useAccessReview(llmAttributes), {
        wrapper: HostApiProvider,
      });
      await waitFor(() => expect(result.current).toEqual([false, true]));
    },
  );

  it.each([null, {}, { status: {} }, { status: { allowed: 'true' } }])(
    'should deny an inconclusive or malformed review: %j',
    async (body) => {
      fetchMock.mockResolvedValue(response(body));
      const { result } = renderHook(() => useAccessReview(llmAttributes), {
        wrapper: HostApiProvider,
      });
      await waitFor(() => expect(result.current).toEqual([false, true]));
    },
  );

  it('should deny invalid JSON instead of leaving the check pending', async () => {
    const invalid = response(undefined);
    fetchMock.mockResolvedValue({ ...invalid, text: async () => '<html>Sign in</html>' });
    const { result } = renderHook(() => useAccessReview(llmAttributes), {
      wrapper: HostApiProvider,
    });
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });

  it('should deny a network failure', async () => {
    fetchMock.mockRejectedValue(new Error('Connection unavailable'));
    const { result } = renderHook(() => useAccessReview(llmAttributes), {
      wrapper: HostApiProvider,
    });
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });

  it('should expose transport rejection to direct host API callers', async () => {
    fetchMock.mockResolvedValue(response({}, 401));
    const { result } = renderHook(useHostApiCore, { wrapper: HostApiProvider });
    await expect(
      result.current.checkAccess({
        ...llmAttributes,
        group: 'serving.kserve.io',
        resource: 'llminferenceservices',
        name: '',
        subresource: '',
        namespace: 'model-project',
      }),
    ).rejects.toThrow('HTTP 401');
  });

  it('should revoke the previous namespace approval while reviewing the next namespace', async () => {
    const resolvers: ((value: Response) => void)[] = [];
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const { result, rerender } = renderHook(
      (namespace) => useAccessReview({ ...llmAttributes, namespace }),
      { initialProps: 'first-project', wrapper: HostApiProvider },
    );
    await act(async () => resolvers[0](response({ status: { allowed: true } })));
    expect(result.current).toEqual([true, true]);

    rerender('second-project');
    expect(result.current).toEqual([false, false]);
    await act(async () => resolvers[1](response({ status: { allowed: false } })));
    expect(result.current).toEqual([false, true]);
    expect(fetchMock.mock.calls[1][1]?.body).toContain('"namespace":"second-project"');
  });

  it('should revoke a granted permission when the credential expires mid-session', async () => {
    fetchMock.mockResolvedValueOnce(response({ status: { allowed: true } }));
    fetchMock.mockResolvedValueOnce(response({}, 401));
    const { result, rerender } = renderHook(
      (namespace) => useAccessReview({ ...llmAttributes, namespace }),
      { initialProps: 'first-project', wrapper: HostApiProvider },
    );
    await waitFor(() => expect(result.current).toEqual([true, true]));

    rerender('second-project');
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });

  it('should revoke a granted permission when a re-review loses the transport', async () => {
    fetchMock.mockResolvedValueOnce(response({ status: { allowed: true } }));
    fetchMock.mockRejectedValueOnce(new Error('Connection unavailable'));
    const { result, rerender } = renderHook((name) => useAccessReview({ ...llmAttributes, name }), {
      initialProps: 'model',
      wrapper: HostApiProvider,
    });
    await waitFor(() => expect(result.current).toEqual([true, true]));

    rerender('other-model');
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });

  it('should not make a request for a disabled check', () => {
    const { result } = renderHook(() => useAccessReview(llmAttributes, false), {
      wrapper: HostApiProvider,
    });
    expect(result.current).toEqual([false, false]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const namespaceUrl = '/api/k8s/api/v1/namespaces/model-project';

const namespaceBody = (
  labels?: Record<string, string>,
  annotations?: Record<string, string>,
): ProjectKind => ({
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'model-project',
    ...(labels !== undefined && { labels }),
    ...(annotations !== undefined && { annotations }),
  },
});

describe('RHAII host serving platform selection', () => {
  it('should patch the namespace label through the Kubernetes transport', async () => {
    fetchMock.mockResolvedValueOnce(response(namespaceBody({ 'modelmesh-enabled': 'true' })));
    fetchMock.mockResolvedValueOnce(response(namespaceBody({ 'modelmesh-enabled': 'false' })));
    const { result } = renderHook(useHostApi, { wrapper: HostApiProvider });

    await expect(
      result.current.setProjectServingPlatform(
        'model-project',
        NamespaceApplicationCase.KSERVE_PROMOTION,
      ),
    ).resolves.toBe('model-project');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(namespaceUrl);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
    expect(fetchMock.mock.calls[1][0]).toBe(namespaceUrl);
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual([
      { op: 'replace', path: '/metadata/labels/modelmesh-enabled', value: 'false' },
    ]);
  });

  it('should remove the platform label and NIM annotation on reset', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        namespaceBody({ 'modelmesh-enabled': 'false' }, { 'opendatahub.io/nim-support': 'true' }),
      ),
    );
    fetchMock.mockResolvedValueOnce(response(namespaceBody()));
    const { result } = renderHook(useHostApi, { wrapper: HostApiProvider });

    await expect(
      result.current.setProjectServingPlatform(
        'model-project',
        NamespaceApplicationCase.RESET_MODEL_SERVING_PLATFORM,
      ),
    ).resolves.toBe('model-project');

    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual([
      { op: 'remove', path: '/metadata/labels/modelmesh-enabled' },
      { op: 'remove', path: '/metadata/annotations/opendatahub.io~1nim-support' },
    ]);
  });

  it('should reject when the transport denies the patch', async () => {
    fetchMock.mockResolvedValueOnce(response(namespaceBody({})));
    fetchMock.mockResolvedValueOnce(response({}, 403));
    const { result } = renderHook(useHostApi, { wrapper: HostApiProvider });

    await expect(
      result.current.setProjectServingPlatform(
        'model-project',
        NamespaceApplicationCase.KSERVE_PROMOTION,
      ),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([NamespaceApplicationCase.DSG_CREATION, NamespaceApplicationCase.KSERVE_NIM_PROMOTION])(
    'should fail closed for the unsupported case %i without a request',
    async (platformCase) => {
      const { result } = renderHook(useHostApi, { wrapper: HostApiProvider });

      await expect(
        result.current.setProjectServingPlatform('model-project', platformCase),
      ).rejects.toThrow('not supported in the RHAII host');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('should pass dry-run through to the transport', async () => {
    fetchMock.mockResolvedValueOnce(response(namespaceBody({})));
    fetchMock.mockResolvedValueOnce(response(namespaceBody({ 'modelmesh-enabled': 'false' })));
    const { result } = renderHook(useHostApi, { wrapper: HostApiProvider });

    await expect(
      result.current.setProjectServingPlatform(
        'model-project',
        NamespaceApplicationCase.KSERVE_PROMOTION,
        true,
      ),
    ).resolves.toBe('model-project');

    expect(fetchMock.mock.calls[0][0]).toContain('dryRun=All');
    expect(fetchMock.mock.calls[1][0]).toContain('dryRun=All');
  });
});

const HostApiWrapper: React.FC<PropsWithChildren> = ({ children }) => (
  <HostApiProvider>{children}</HostApiProvider>
);

describe('RHAII host tracking', () => {
  it('should mount a tracking no-op without accessing or initializing the global SDK', async () => {
    const originalAnalytics = Object.getOwnPropertyDescriptor(window, 'analytics');
    const sdk = { track: jest.fn(), page: jest.fn() };
    const analyticsRead = jest.fn(() => sdk);
    const analyticsWrite = jest.fn();

    try {
      Object.defineProperty(window, 'analytics', {
        configurable: true,
        get: analyticsRead,
        set: analyticsWrite,
      });
      const { result, rerender } = renderHook(
        () => ({ track: useTrackEvent(), page: useTrackPageEvent() }),
        { wrapper: HostApiWrapper },
      );

      await waitFor(() => expect(result.current.track).toBeDefined());

      const initial = result.current;
      rerender();
      expect(result.current.track).toBe(initial.track);
      expect(result.current.page).toBe(initial.page);
      expect(
        result.current.track('custom-event', { outcome: 'submit', success: false }),
      ).toBeUndefined();
      expect(result.current.page()).toBeUndefined();
      expect(analyticsRead).not.toHaveBeenCalled();
      expect(analyticsWrite).not.toHaveBeenCalled();
      expect(sdk.track).not.toHaveBeenCalled();
      expect(sdk.page).not.toHaveBeenCalled();

      Reflect.deleteProperty(window, 'analytics');
      expect(() => result.current.track('custom-event', {})).not.toThrow();
      expect(() => result.current.page()).not.toThrow();
      expect(Object.getOwnPropertyDescriptor(window, 'analytics')).toBeUndefined();
    } finally {
      if (originalAnalytics) {
        Object.defineProperty(window, 'analytics', originalAnalytics);
      } else {
        Reflect.deleteProperty(window, 'analytics');
      }
    }
  });
});
