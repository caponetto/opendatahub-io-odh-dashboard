import { getK8sClientConfig } from './config';
import { K8sStatusError, isK8sStatus } from './errors';
import type {
  K8sFetchOptions,
  K8sModelCommon,
  K8sResourceBaseOptions,
  K8sResourceCommon,
  K8sResourceCreateOptions,
  K8sResourceDeleteOptions,
  K8sResourceListResult,
  K8sResourcePatchOptions,
  K8sResourceQueryOptions,
  K8sResourceUpdateOptions,
  QueryParams,
} from './types';

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModelCommon): string =>
  apiGroup === 'core' && apiVersion === 'v1'
    ? `/api/${apiVersion}`
    : `/apis/${apiGroup}/${apiVersion}`;

const getQueryString = (queryParams: QueryParams): string =>
  Object.entries(queryParams)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

export const getK8sResourceURL = (
  model: K8sModelCommon,
  resource?: K8sResourceCommon,
  queryOptions: K8sResourceQueryOptions = {},
  isCreate = false,
): string => {
  const { ns, name, path, queryParams } = queryOptions;
  let resourcePath = getK8sAPIPath(model);

  if (resource?.metadata?.namespace) {
    resourcePath += `/namespaces/${resource.metadata.namespace}`;
  } else if (ns) {
    resourcePath += `/namespaces/${ns}`;
  }

  if (resource?.metadata?.namespace && ns && resource.metadata.namespace !== ns) {
    throw new Error('Resource payload namespace vs. query options namespace mismatch');
  }

  resourcePath += `/${model.plural}`;

  if (!isCreate) {
    if (resource?.metadata?.name) {
      resourcePath += `/${encodeURIComponent(resource.metadata.name)}`;
    } else if (name) {
      resourcePath += `/${encodeURIComponent(name)}`;
    }
  }

  if (resource?.metadata?.name && name && resource.metadata.name !== name) {
    throw new Error('Resource payload name vs. query options name mismatch');
  }

  if (path) {
    resourcePath += `/${path}`;
  }

  if (queryParams && Object.keys(queryParams).length > 0) {
    resourcePath += `?${getQueryString(queryParams)}`;
  }

  return resourcePath;
};

const mergeHeaders = (headers: HeadersInit | undefined, contentType?: string): Headers => {
  const merged = new Headers(headers);
  if (contentType && !merged.has('Content-Type')) {
    merged.set('Content-Type', contentType);
  }
  if (!merged.has('Accept')) {
    merged.set('Accept', 'application/json');
  }
  return merged;
};

const buildRequestInit = (
  method: string,
  fetchOptions: K8sFetchOptions | undefined,
  body?: unknown,
  contentType?: string,
): RequestInit => {
  const requestInit = fetchOptions?.requestInit ?? {};
  return {
    ...requestInit,
    method,
    headers: mergeHeaders(requestInit.headers, contentType),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };
};

const withTimeoutSignal = (
  requestInit: RequestInit,
  timeout?: number,
): { cleanup: () => void; requestInit: RequestInit } => {
  if (!timeout) {
    return { cleanup: () => undefined, requestInit };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const externalSignal = requestInit.signal;

  if (externalSignal) {
    externalSignal.addEventListener(
      'abort',
      () => {
        controller.abort();
      },
      { once: true },
    );
  }

  return {
    cleanup: () => clearTimeout(timeoutId),
    requestInit: {
      ...requestInit,
      signal: controller.signal,
    },
  };
};

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.clone().text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const commonFetchJSON = async <T>(
  url: string,
  requestInit: RequestInit = {},
  timeout?: number,
  prependApiBasePath = false,
): Promise<T> => {
  const { apiBasePath, fetchFn } = getK8sClientConfig();
  const timedRequest = withTimeoutSignal(requestInit, timeout);

  try {
    const response = await fetchFn(
      prependApiBasePath ? `${apiBasePath}${url}` : url,
      timedRequest.requestInit,
    );
    const parsedBody = await parseResponseBody(response);

    if (response.status >= 400) {
      if (isK8sStatus(parsedBody)) {
        throw new K8sStatusError(parsedBody);
      }
      throw new Error(
        typeof parsedBody === 'string'
          ? parsedBody
          : `Kubernetes request failed with status ${response.status}`,
      );
    }

    return parsedBody;
  } finally {
    timedRequest.cleanup();
  }
};

export const commonFetchText = async (
  url: string,
  requestInit: RequestInit = {},
  timeout?: number,
  prependApiBasePath = false,
): Promise<string> => {
  const { apiBasePath, fetchFn } = getK8sClientConfig();
  const timedRequest = withTimeoutSignal(requestInit, timeout);

  try {
    const response = await fetchFn(
      prependApiBasePath ? `${apiBasePath}${url}` : url,
      timedRequest.requestInit,
    );
    const text = await response.text();

    if (response.status >= 400) {
      try {
        const parsed = JSON.parse(text);
        if (isK8sStatus(parsed)) {
          throw new K8sStatusError(parsed);
        }
      } catch {
        // fall through to generic text error
      }
      throw new Error(text || `Kubernetes request failed with status ${response.status}`);
    }

    return text;
  } finally {
    timedRequest.cleanup();
  }
};

const requestK8sResource = async <T>(
  method: string,
  options: K8sResourceBaseOptions,
  body?: unknown,
  contentType?: string,
  isCreate = false,
): Promise<T> => {
  const { apiBasePath } = getK8sClientConfig();
  return commonFetchJSON<T>(
    `${apiBasePath}${getK8sResourceURL(options.model, undefined, options.queryOptions, isCreate)}`,
    buildRequestInit(method, options.fetchOptions, body, contentType),
    options.fetchOptions?.timeout,
  );
};

export const k8sGetResource = <TResource extends K8sResourceCommon>(
  options: K8sResourceBaseOptions,
): Promise<TResource> => requestK8sResource<TResource>('GET', options);

export const k8sListResource = <TResource extends Partial<K8sResourceCommon>>(
  options: K8sResourceBaseOptions,
): Promise<K8sResourceListResult<TResource>> =>
  requestK8sResource<K8sResourceListResult<TResource>>('GET', options);

export const k8sListResourceItems = <TResource extends Partial<K8sResourceCommon>>(
  options: K8sResourceBaseOptions,
): Promise<TResource[]> => k8sListResource<TResource>(options).then((result) => result.items);

export const k8sCreateResource = <TResource extends K8sResourceCommon, TResponse = TResource>(
  options: K8sResourceCreateOptions<TResource>,
): Promise<TResponse> => {
  const { apiBasePath } = getK8sClientConfig();
  return commonFetchJSON<TResponse>(
    `${apiBasePath}${getK8sResourceURL(
      options.model,
      options.resource,
      options.queryOptions,
      true,
    )}`,
    buildRequestInit('POST', options.fetchOptions, options.resource, 'application/json'),
    options.fetchOptions?.timeout,
  );
};

export const k8sUpdateResource = <TResource extends K8sResourceCommon>(
  options: K8sResourceUpdateOptions<TResource>,
): Promise<TResource> => {
  const { apiBasePath } = getK8sClientConfig();
  return commonFetchJSON<TResource>(
    `${apiBasePath}${getK8sResourceURL(options.model, options.resource, options.queryOptions)}`,
    buildRequestInit('PUT', options.fetchOptions, options.resource, 'application/json'),
    options.fetchOptions?.timeout,
  );
};

export const k8sPatchResource = <TResource extends K8sResourceCommon>(
  options: K8sResourcePatchOptions,
): Promise<TResource> =>
  requestK8sResource<TResource>('PATCH', options, options.patches, 'application/json-patch+json');

export const k8sDeleteResource = <TResource extends K8sResourceCommon, TResponse = TResource>(
  options: K8sResourceDeleteOptions,
): Promise<TResponse> =>
  requestK8sResource<TResponse>(
    'DELETE',
    options,
    options.payload,
    options.payload ? 'application/json' : undefined,
  );
