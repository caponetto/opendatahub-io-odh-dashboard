import { renderHook, waitFor } from '@testing-library/react';
import { setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import { useServingConnections } from '../useServingConnections';
import { k8sFetch } from '../k8sFetch';

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

// The SDK parses text; transport errors parse JSON. Neither path needs a browser Response body.
const response = (body: unknown, status = 201): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response);

const connectionSecret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'saved-uri',
    namespace: 'model-project',
    labels: { 'opendatahub.io/dashboard': 'true' },
    annotations: {
      'openshift.io/display-name': 'Saved URI',
      'opendatahub.io/connection-type-ref': 'uri-v1',
      'opendatahub.io/connection-type': 'uri',
    },
  },
  stringData: { URI: 'hf://model' },
};

const plainSecret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'not-a-connection',
    namespace: 'model-project',
    labels: { 'opendatahub.io/dashboard': 'true' },
  },
  stringData: { token: 'value' },
};

beforeAll(() => {
  setUtilsConfig({
    appFetch: k8sFetch,
    wsAppSettings: async () => ({ host: 'ws://localhost', subProtocols: [] }),
  });
});

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('useServingConnections', () => {
  it('should list only connection secrets through the transport', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        apiVersion: 'v1',
        kind: 'SecretList',
        items: [connectionSecret, plainSecret],
      }),
    );
    const { result } = renderHook(() => useServingConnections('model-project', true, false));

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[0].map((c) => c.metadata.name)).toEqual(['saved-uri']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/k8s/api/v1/namespaces/model-project/secrets',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should abort the listing on unmount', async () => {
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>(() => {
          // Stays pending: the abort is what ends it.
        }),
    );
    const { unmount } = renderHook(() => useServingConnections('model-project', true, false));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const { signal } = fetchMock.mock.calls[0][1] as RequestInit;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('should list by the dashboard label when hidden connections are excluded', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        apiVersion: 'v1',
        kind: 'SecretList',
        items: [connectionSecret],
      }),
    );
    const { result } = renderHook(() => useServingConnections('model-project'));

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[0].map((c) => c.metadata.name)).toEqual(['saved-uri']);
    expect(fetchMock.mock.calls[0][0]).toContain('labelSelector=');
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
