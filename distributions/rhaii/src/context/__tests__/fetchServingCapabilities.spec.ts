import { fetchBootstrapStatus } from '../DashboardNamespaceContext';
import { fetchServingCapabilities } from '../fetchServingCapabilities';

const response = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

const groupUrl = '/api/k8s/apis/serving.kserve.io';
const resourcesUrl = '/api/k8s/apis/serving.kserve.io/v1alpha2';

const fetchMock = jest.fn<Promise<Response>, [string, (RequestInit | undefined)?]>();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('fetchBootstrapStatus', () => {
  it('should resolve the namespace from the status contract', async () => {
    fetchMock.mockResolvedValueOnce(response({ kube: { namespace: 'redhat-ods-applications' } }));

    await expect(fetchBootstrapStatus()).resolves.toEqual({
      namespace: 'redhat-ods-applications',
      userName: undefined,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/status', { signal: undefined });
  });

  it('should resolve the user name from the status contract', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ kube: { namespace: 'ns', userName: 'dev@redhat.com' } }),
    );

    await expect(fetchBootstrapStatus()).resolves.toEqual({
      namespace: 'ns',
      userName: 'dev@redhat.com',
    });
  });

  it('should fall back to the kubeconfig user entry name', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ kube: { namespace: 'ns', currentUser: { name: 'kube-user' } } }),
    );

    await expect(fetchBootstrapStatus()).resolves.toEqual({
      namespace: 'ns',
      userName: 'kube-user',
    });
  });

  it('should treat a non-string user name as absent, not a failure', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ kube: { namespace: 'ns', userName: 7, currentUser: { name: false } } }),
    );

    await expect(fetchBootstrapStatus()).resolves.toEqual({
      namespace: 'ns',
      userName: undefined,
    });
  });

  it('should pass the abort signal through', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(response({ kube: { namespace: 'ns' } }));

    await fetchBootstrapStatus(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/status',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it.each([500, 401])('should reject an HTTP %s status', async (status) => {
    fetchMock.mockResolvedValueOnce(response({}, status));

    await expect(fetchBootstrapStatus()).rejects.toThrow(`HTTP ${status}`);
  });

  it.each([{}, { kube: {} }, { kube: { namespace: '' } }, { kube: { namespace: 7 } }, null])(
    'should reject a status without a usable namespace: %j',
    async (body) => {
      fetchMock.mockResolvedValueOnce(response(body));

      await expect(fetchBootstrapStatus()).rejects.toThrow(
        'did not include the application namespace',
      );
    },
  );

  it('should reject invalid JSON instead of resolving a fallback', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      },
    } as unknown as Response);

    await expect(fetchBootstrapStatus()).rejects.toThrow(
      'did not include the application namespace',
    );
  });
});

describe('fetchServingCapabilities', () => {
  const bothResources = {
    resources: [{ name: 'llminferenceservices' }, { name: 'inferenceservices' }],
  };

  const mockServedGroup = () => {
    fetchMock.mockResolvedValueOnce(
      response({ versions: [{ groupVersion: 'serving.kserve.io/v1alpha2' }] }),
    );
  };

  it('should discover both serving capabilities from served resources', async () => {
    mockServedGroup();
    fetchMock.mockResolvedValueOnce(response(bothResources));

    await expect(fetchServingCapabilities()).resolves.toEqual({
      llmdServing: true,
      kServe: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(groupUrl);
    expect(fetchMock.mock.calls[1][0]).toBe(resourcesUrl);
  });

  it('should gate both capabilities when the API group is not served', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 404));

    await expect(fetchServingCapabilities()).resolves.toEqual({
      llmdServing: false,
      kServe: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should gate a capability whose resource is not served', async () => {
    mockServedGroup();
    fetchMock.mockResolvedValueOnce(response({ resources: [{ name: 'inferenceservices' }] }));

    await expect(fetchServingCapabilities()).resolves.toEqual({
      llmdServing: false,
      kServe: true,
    });
  });

  it('should union resources across served versions', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        versions: [
          { groupVersion: 'serving.kserve.io/v1beta1' },
          { groupVersion: 'serving.kserve.io/v1alpha2' },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(response({ resources: [{ name: 'inferenceservices' }] }));
    fetchMock.mockResolvedValueOnce(response({ resources: [{ name: 'llminferenceservices' }] }));

    await expect(fetchServingCapabilities()).resolves.toEqual({
      llmdServing: true,
      kServe: true,
    });
  });

  it('should tolerate a version that disappears between discovery calls', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        versions: [
          { groupVersion: 'serving.kserve.io/v1alpha1' },
          { groupVersion: 'serving.kserve.io/v1alpha2' },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(response({}, 404));
    fetchMock.mockResolvedValueOnce(response(bothResources));

    await expect(fetchServingCapabilities()).resolves.toEqual({
      llmdServing: true,
      kServe: true,
    });
  });

  it.each([500, 403])('should reject a failing group discovery (HTTP %s)', async (status) => {
    fetchMock.mockResolvedValueOnce(response({}, status));

    await expect(fetchServingCapabilities()).rejects.toThrow('Unable to discover the serving APIs');
  });

  it('should reject a failing resource discovery', async () => {
    mockServedGroup();
    fetchMock.mockResolvedValueOnce(response({}, 500));

    await expect(fetchServingCapabilities()).rejects.toThrow(
      'Unable to discover the serving.kserve.io/v1alpha2 resources',
    );
  });

  it.each([{}, { versions: 'nope' }, null])(
    'should reject a malformed group response: %j',
    async (body) => {
      fetchMock.mockResolvedValueOnce(response(body));

      await expect(fetchServingCapabilities()).rejects.toThrow(
        'Invalid serving API discovery response',
      );
    },
  );
});
