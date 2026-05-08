type WebSocketLike = {
  close: (code?: number, reason?: string) => void;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onopen: ((event: Event) => void) | null;
};

export type K8sClientConfig = {
  apiBasePath: string;
  fetchFn: typeof fetch;
  webSocketFactory: (url: string, protocols?: string | string[]) => WebSocketLike;
  wsBasePath: string;
  wsHost: string;
};

const getDefaultWsHost = (): string => {
  if (typeof process !== 'undefined' && process.env.WS_HOSTNAME) {
    return process.env.WS_HOSTNAME;
  }
  if (typeof location !== 'undefined' && location.host) {
    return location.host;
  }
  return 'localhost';
};

const defaultFetchFn: typeof fetch = (
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> => {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('K8s client fetch function is not configured');
  }

  return globalThis.fetch(...args);
};

const defaultConfig = (): K8sClientConfig => ({
  apiBasePath: '/api/k8s',
  fetchFn: defaultFetchFn,
  webSocketFactory: (url, protocols) => new WebSocket(url, protocols),
  wsBasePath: '/wss/k8s',
  wsHost: getDefaultWsHost(),
});

let clientConfig = defaultConfig();

export const getK8sClientConfig = (): K8sClientConfig => clientConfig;

export const configureK8sClient = (config: Partial<K8sClientConfig>): K8sClientConfig => {
  clientConfig = {
    ...clientConfig,
    ...config,
  };
  return clientConfig;
};

export const resetK8sClientConfig = (): void => {
  clientConfig = defaultConfig();
};
