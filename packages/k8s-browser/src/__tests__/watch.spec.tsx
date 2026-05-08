import { renderHook, waitFor } from '@testing-library/react';
import {
  type K8sClientConfig,
  type K8sModelCommon,
  configureK8sClient,
  resetK8sClientConfig,
  useK8sWatchResource,
} from '..';

const inferenceServiceModel: K8sModelCommon = {
  apiGroup: 'serving.kserve.io',
  apiVersion: 'v1beta1',
  kind: 'InferenceService',
  plural: 'inferenceservices',
};

const mockFetch = jest.fn();

const createJsonResponse = (body: unknown, status = 200): Response => {
  const serializedBody = JSON.stringify(body);
  return {
    status,
    text: async () => serializedBody,
    clone: () => createJsonResponse(body, status),
  } as Response;
};

class MockWebSocket {
  static readonly instances: MockWebSocket[] = [];

  public onopen: ((event: Event) => void) | null = null;

  public onmessage: ((event: MessageEvent<string>) => void) | null = null;

  public onerror: ((event: Event) => void) | null = null;

  public onclose: ((event: CloseEvent) => void) | null = null;

  public readyState = 0;

  constructor(public readonly url: string, public readonly protocols?: string | string[]) {
    MockWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  message(data: unknown): void {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify(data),
      }),
    );
  }

  error(): void {
    this.onerror?.(new Event('error'));
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.(new CloseEvent('close'));
  }

  send(): void {
    // no-op for tests
  }
}

describe('useK8sWatchResource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    MockWebSocket.instances.length = 0;
    const webSocketFactory: K8sClientConfig['webSocketFactory'] = (
      url: string,
      protocols?: string | string[],
    ) => new MockWebSocket(url, protocols);
    configureK8sClient({
      fetchFn: mockFetch as unknown as typeof fetch,
      webSocketFactory,
    });
  });

  afterEach(() => {
    resetK8sClientConfig();
  });

  it('should fetch the initial list and reconcile watch events', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse({
        apiVersion: 'v1',
        kind: 'InferenceServiceList',
        items: [
          {
            apiVersion: 'serving.kserve.io/v1beta1',
            kind: 'InferenceService',
            metadata: {
              name: 'existing',
              namespace: 'test-project',
              resourceVersion: '123',
            },
          },
        ],
        metadata: { resourceVersion: '123' },
      }),
    );

    const { result } = renderHook(() =>
      useK8sWatchResource(
        {
          isList: true,
          groupVersionKind: {
            group: inferenceServiceModel.apiGroup,
            version: inferenceServiceModel.apiVersion,
            kind: inferenceServiceModel.kind,
          },
          namespace: 'test-project',
          selector: { matchLabels: { 'app.kubernetes.io/name': 'example' } },
        },
        inferenceServiceModel,
      ),
    );

    await waitFor(() => expect(result.current[1]).toBe(true));

    expect(result.current[0]).toHaveLength(1);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(
      'ws://localhost/wss/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices?labelSelector=app.kubernetes.io%2Fname%3Dexample&resourceVersion=123&allowWatchBookmarks=true&watch=true',
    );

    MockWebSocket.instances[0].open();
    MockWebSocket.instances[0].message({
      type: 'ADDED',
      object: {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: 'added',
          namespace: 'test-project',
          resourceVersion: '124',
        },
      },
    });
    MockWebSocket.instances[0].message({
      type: 'DELETED',
      object: {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: 'existing',
          namespace: 'test-project',
          resourceVersion: '125',
        },
      },
    });

    await waitFor(() =>
      expect(result.current[0]).toEqual([
        expect.objectContaining({
          metadata: expect.objectContaining({ name: 'added' }),
        }),
      ]),
    );
  });

  it('should surface fetch failures as errors', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse(
        {
          apiVersion: 'v1',
          kind: 'Status',
          status: 'Failure',
          code: 403,
          message: 'Forbidden',
        },
        403,
      ),
    );

    const { result } = renderHook(() =>
      useK8sWatchResource(
        {
          isList: true,
          groupVersionKind: {
            group: inferenceServiceModel.apiGroup,
            version: inferenceServiceModel.apiVersion,
            kind: inferenceServiceModel.kind,
          },
          namespace: 'test-project',
        },
        inferenceServiceModel,
      ),
    );

    await waitFor(() => expect(result.current[2]).toBeInstanceOf(Error));
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('should reconnect the watch after websocket failures', async () => {
    jest.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(
        createJsonResponse({
          apiVersion: 'v1',
          kind: 'InferenceServiceList',
          items: [],
          metadata: { resourceVersion: '123' },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          apiVersion: 'v1',
          kind: 'InferenceServiceList',
          items: [],
          metadata: { resourceVersion: '124' },
        }),
      );

    renderHook(() =>
      useK8sWatchResource(
        {
          isList: true,
          groupVersionKind: {
            group: inferenceServiceModel.apiGroup,
            version: inferenceServiceModel.apiVersion,
            kind: inferenceServiceModel.kind,
          },
          namespace: 'test-project',
        },
        inferenceServiceModel,
      ),
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

    MockWebSocket.instances[0].error();

    await jest.advanceTimersByTimeAsync(1000);

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(2));
    expect(MockWebSocket.instances[1].url).toBe(
      'ws://localhost/wss/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices?resourceVersion=124&allowWatchBookmarks=true&watch=true',
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
