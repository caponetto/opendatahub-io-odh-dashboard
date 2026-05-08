import * as React from 'react';
import { getK8sClientConfig } from './config';
import { K8sStatusError, isK8sStatus } from './errors';
import { getK8sResourceURL, k8sGetResource, k8sListResource } from './resources';
import type {
  K8sModelCommon,
  K8sResourceCommon,
  K8sResourceListResult,
  QueryParams,
  Selector,
  WatchEvent,
  WatchK8sResource,
  WebSocketOptions,
} from './types';

const isLabelSelectorObject = (selector: Selector): selector is Record<string, string> =>
  !('matchLabels' in selector) && !('matchExpressions' in selector);

const selectorToLabelSelector = (selector?: Selector): string | undefined => {
  if (!selector) {
    return undefined;
  }

  if (isLabelSelectorObject(selector)) {
    return Object.entries(selector)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  const labelSegments = Object.entries(selector.matchLabels ?? {}).map(
    ([key, value]) => `${key}=${value}`,
  );
  const expressionSegments = (selector.matchExpressions ?? []).map((expression) => {
    switch (expression.operator) {
      case 'DoesNotExist':
        return `!${expression.key}`;
      case 'Exists':
        return expression.key;
      case 'In':
        return `${expression.key} in (${(expression.values ?? []).join(',')})`;
      case 'NotIn':
        return `${expression.key} notin (${(expression.values ?? []).join(',')})`;
      case 'Gt':
      case 'Lt':
        return `${expression.key}${expression.operator.toLowerCase()}${
          expression.values?.[0] ?? ''
        }`;
      default:
        return expression.key;
    }
  });

  return [...labelSegments, ...expressionSegments].join(',');
};

const buildQueryOptions = (
  resource: WatchK8sResource,
): {
  name?: string;
  ns?: string;
  queryParams?: QueryParams;
} => {
  const labelSelector = selectorToLabelSelector(resource.selector);
  const queryParams: QueryParams = {
    ...(labelSelector && { labelSelector }),
    ...(resource.fieldSelector && { fieldSelector: resource.fieldSelector }),
  };

  return {
    ...(resource.name && { name: resource.name }),
    ...(resource.namespace !== undefined && { ns: resource.namespace }),
    ...(Object.keys(queryParams).length > 0 && { queryParams }),
  };
};

const buildWebSocketUrl = (
  model: K8sModelCommon,
  resource: WatchK8sResource,
  listResource?: K8sResourceListResult<Partial<K8sResourceCommon>>,
  options?: Partial<WebSocketOptions & RequestInit>,
): string => {
  const { wsBasePath, wsHost } = getK8sClientConfig();
  const protocol =
    typeof location !== 'undefined' ? location.protocol.replace(/^http/i, 'ws') : 'ws:';
  const baseUrl = `${protocol}//${wsHost}${options?.wsPrefix ?? wsBasePath}`;
  const queryOptions = buildQueryOptions(resource);
  const watchQueryParams: QueryParams = {
    ...queryOptions.queryParams,
    ...(listResource?.metadata.resourceVersion && {
      resourceVersion: listResource.metadata.resourceVersion,
    }),
    allowWatchBookmarks: true,
    watch: true,
  };

  const url = `${baseUrl}${getK8sResourceURL(
    model,
    undefined,
    { ...queryOptions, queryParams: watchQueryParams },
    false,
  )}`;

  return options?.urlAugment ? options.urlAugment(url) : url;
};

const getResourceKey = (resource: Partial<K8sResourceCommon>): string =>
  `${resource.metadata?.namespace ?? ''}/${resource.metadata?.name ?? ''}`;

const WATCH_RECONNECT_DELAY_MS = 1000;
const WATCH_RECONNECT_MAX_DELAY_MS = 10000;

const applyListEvent = <TResource extends K8sResourceCommon>(
  items: TResource[],
  event: WatchEvent<TResource>,
): TResource[] => {
  const resourceObject = event.object;
  if (isK8sStatus(resourceObject) || event.type === 'BOOKMARK') {
    return items;
  }

  if (event.type === 'DELETED') {
    return items.filter((item) => getResourceKey(item) !== getResourceKey(resourceObject));
  }

  const nextItems = [...items];
  const itemIndex = nextItems.findIndex(
    (item) => getResourceKey(item) === getResourceKey(resourceObject),
  );
  if (itemIndex >= 0) {
    nextItems[itemIndex] = resourceObject;
  } else {
    nextItems.push(resourceObject);
  }
  return nextItems;
};

export function useK8sWatchResource<TResource extends K8sResourceCommon[]>(
  initResource: (WatchK8sResource & { isList: true }) | null,
  initModel?: K8sModelCommon,
  options?: Partial<WebSocketOptions & RequestInit>,
): [TResource | undefined, boolean, unknown];
export function useK8sWatchResource<TResource extends K8sResourceCommon>(
  initResource: WatchK8sResource | null,
  initModel?: K8sModelCommon,
  options?: Partial<WebSocketOptions & RequestInit>,
): [TResource | undefined, boolean, unknown];
export function useK8sWatchResource(
  initResource: WatchK8sResource | null,
  initModel?: K8sModelCommon,
  options?: Partial<WebSocketOptions & RequestInit>,
): [K8sResourceCommon | K8sResourceCommon[] | undefined, boolean, unknown] {
  const [data, setData] = React.useState<K8sResourceCommon | K8sResourceCommon[]>();
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<unknown>();
  const modelKey = JSON.stringify(initModel ?? null);
  const resourceKey = JSON.stringify({
    fieldSelector: initResource?.fieldSelector ?? null,
    groupVersionKind: initResource?.groupVersionKind ?? null,
    isList: initResource?.isList ?? null,
    name: initResource?.name ?? null,
    namespace: initResource?.namespace ?? null,
    selector: initResource?.selector ?? null,
  });
  const subProtocolsKey = JSON.stringify(options?.subProtocols ?? null);
  const watchModelRef = React.useRef(initModel);
  const watchModelKeyRef = React.useRef(modelKey);
  const watchResourceRef = React.useRef(initResource);
  const watchResourceKeyRef = React.useRef(resourceKey);

  if (watchModelKeyRef.current !== modelKey) {
    watchModelKeyRef.current = modelKey;
    watchModelRef.current = initModel;
  }

  if (watchResourceKeyRef.current !== resourceKey) {
    watchResourceKeyRef.current = resourceKey;
    watchResourceRef.current = initResource;
  }

  React.useEffect(() => {
    const watchModel = watchModelRef.current;
    const watchResource = watchResourceRef.current;

    if (!watchResource || !watchModel) {
      setData(undefined);
      setLoaded(false);
      setError(undefined);
      return undefined;
    }

    let active = true;
    let socket:
      | (ReturnType<typeof getK8sClientConfig>['webSocketFactory'] extends (
          ...args: never[]
        ) => infer TResult
          ? TResult
          : never)
      | undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempts = 0;
    let reconnectScheduled = false;

    const disposeSocket = () => {
      if (!socket) {
        return;
      }

      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      socket.close();
      socket = undefined;
    };

    const scheduleReconnect = (nextError?: unknown) => {
      if (!active || !watchResource.isList || reconnectScheduled) {
        return;
      }

      if (nextError) {
        setError(nextError);
      }

      reconnectScheduled = true;
      const reconnectDelay = Math.min(
        WATCH_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
        WATCH_RECONNECT_MAX_DELAY_MS,
      );
      reconnectAttempts += 1;
      reconnectTimeout = setTimeout(() => {
        reconnectScheduled = false;
        reconnectTimeout = undefined;
        if (!active) {
          return;
        }
        disposeSocket();
        void load();
      }, reconnectDelay);
    };

    const load = async (): Promise<void> => {
      try {
        const queryOptions = buildQueryOptions(watchResource);
        if (watchResource.isList) {
          const listResult = await k8sListResource<K8sResourceCommon>({
            model: watchModel,
            queryOptions,
            fetchOptions: {
              requestInit: options,
            },
          });

          if (!active) {
            return;
          }

          setData(listResult.items);
          setLoaded(true);
          setError(undefined);

          const { webSocketFactory } = getK8sClientConfig();
          disposeSocket();
          socket = webSocketFactory(
            buildWebSocketUrl(watchModel, watchResource, listResult, options),
            options?.subProtocols,
          );
          socket.onopen = () => {
            reconnectAttempts = 0;
            setError(undefined);
          };

          socket.onmessage = (messageEvent) => {
            const event: WatchEvent<K8sResourceCommon> = JSON.parse(messageEvent.data);
            if (isK8sStatus(event.object)) {
              scheduleReconnect(new K8sStatusError(event.object));
              return;
            }
            setData((current) => applyListEvent(Array.isArray(current) ? current : [], event));
          };
          socket.onerror = () => {
            scheduleReconnect(new Error('Failed to watch Kubernetes resource'));
          };
          socket.onclose = () => {
            scheduleReconnect(new Error('Lost Kubernetes watch connection'));
          };
          return;
        }

        const resource = await k8sGetResource<K8sResourceCommon>({
          model: watchModel,
          queryOptions,
          fetchOptions: {
            requestInit: options,
          },
        });

        if (!active) {
          return;
        }

        setData(resource);
        setLoaded(true);
        setError(undefined);
      } catch (e) {
        if (!active) {
          return;
        }
        setError(e);
      }
    };

    void load();

    return () => {
      active = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      disposeSocket();
    };
  }, [modelKey, options, resourceKey, subProtocolsKey]);

  return [data, loaded, error];
}
