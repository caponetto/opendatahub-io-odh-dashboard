import {
  K8sStatusError,
  type K8sModelCommon,
  commonFetchJSON,
  commonFetchText,
  configureK8sClient,
  k8sCreateResource,
  k8sDeleteResource,
  k8sGetResource,
  k8sListResource,
  k8sPatchResource,
  k8sUpdateResource,
  resetK8sClientConfig,
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

describe('k8s resource helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureK8sClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
  });

  afterEach(() => {
    resetK8sClientConfig();
  });

  it('should get a resource using the Kubernetes proxy URL', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse({
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: { name: 'example', namespace: 'test-project' },
      }),
    );

    const result = await k8sGetResource({
      model: inferenceServiceModel,
      queryOptions: { name: 'example', ns: 'test-project' },
    });

    expect(result).toMatchObject({
      metadata: { name: 'example', namespace: 'test-project' },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/example',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should list resources and include query params', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse({
        apiVersion: 'v1',
        kind: 'InferenceServiceList',
        items: [{ metadata: { name: 'example' } }],
        metadata: { resourceVersion: '123' },
      }),
    );

    const result = await k8sListResource({
      model: inferenceServiceModel,
      queryOptions: {
        ns: 'test-project',
        queryParams: { labelSelector: 'app=test' },
      },
    });

    expect(result.items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices?labelSelector=app%3Dtest',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should create, update, patch, and delete resources', async () => {
    const resource = {
      apiVersion: 'serving.kserve.io/v1beta1',
      kind: 'InferenceService',
      metadata: { name: 'example', namespace: 'test-project' },
      spec: {},
    };

    mockFetch
      .mockResolvedValueOnce(createJsonResponse(resource))
      .mockResolvedValueOnce(createJsonResponse(resource))
      .mockResolvedValueOnce(createJsonResponse(resource))
      .mockResolvedValueOnce(createJsonResponse({ kind: 'Status', status: 'Success', code: 200 }));

    await k8sCreateResource({
      model: inferenceServiceModel,
      resource,
    });
    await k8sUpdateResource({
      model: inferenceServiceModel,
      resource,
    });
    await k8sPatchResource({
      model: inferenceServiceModel,
      queryOptions: { name: 'example', ns: 'test-project' },
      patches: [{ op: 'replace', path: '/spec', value: { predictor: {} } }],
    });
    await k8sDeleteResource({
      model: inferenceServiceModel,
      queryOptions: { name: 'example', ns: 'test-project' },
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(resource),
      }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/example',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(resource),
      }),
    );
    const patchCall = mockFetch.mock.calls[2];
    expect(patchCall[0]).toBe(
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/example',
    );
    expect(patchCall[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify([{ op: 'replace', path: '/spec', value: { predictor: {} } }]),
      }),
    );
    expect(new Headers(patchCall[1]?.headers).get('Content-Type')).toBe(
      'application/json-patch+json',
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      '/api/k8s/apis/serving.kserve.io/v1beta1/namespaces/test-project/inferenceservices/example',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('should throw a K8sStatusError for Kubernetes status responses', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse(
        {
          apiVersion: 'v1',
          kind: 'Status',
          code: 404,
          message: 'InferenceService not found',
          status: 'Failure',
        },
        404,
      ),
    );

    await expect(
      k8sGetResource({
        model: inferenceServiceModel,
        queryOptions: { name: 'missing', ns: 'test-project' },
      }),
    ).rejects.toBeInstanceOf(K8sStatusError);
  });

  it('should optionally prepend the Kubernetes proxy prefix for common fetch helpers', async () => {
    mockFetch
      .mockResolvedValueOnce(createJsonResponse({ ok: true }))
      .mockResolvedValueOnce({ status: 200, text: async () => 'log output' } as Response);

    await expect(
      commonFetchJSON('/apis/example/v1/widgets', undefined, undefined, true),
    ).resolves.toEqual({ ok: true });
    await expect(
      commonFetchText('/apis/example/v1/widgets/log', undefined, undefined, true),
    ).resolves.toBe('log output');

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      '/api/k8s/apis/example/v1/widgets',
      expect.anything(),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      '/api/k8s/apis/example/v1/widgets/log',
      expect.anything(),
    );
  });
});
