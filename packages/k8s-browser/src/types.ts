export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export type MatchExpression = {
  key: string;
  operator: string;
  values?: string[];
};

export type K8sGroupVersionKind = {
  group?: string;
  version: string;
  kind: string;
};

export type K8sModelCommon = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
  plural: string;
};

export type K8sResourceIdentifier = {
  apiVersion?: string;
  kind?: string;
};

export type K8sResourceCommon = K8sResourceIdentifier & {
  metadata?: {
    annotations?: Record<string, string | undefined>;
    clusterName?: string;
    creationTimestamp?: string;
    deletionGracePeriodSeconds?: number;
    deletionTimestamp?: string;
    finalizers?: string[];
    generateName?: string;
    generation?: number;
    labels?: Record<string, string | undefined>;
    managedFields?: unknown[];
    name?: string;
    namespace?: string;
    ownerReferences?: Array<{
      apiVersion: string;
      blockOwnerDeletion?: boolean;
      controller?: boolean;
      kind: string;
      name: string;
      uid: string;
    }>;
    resourceVersion?: string;
    uid?: string;
    [key: string]: unknown;
  };
  spec?: {
    selector?:
      | Record<string, string | undefined>
      | {
          matchExpressions?: MatchExpression[];
          matchLabels?: Record<string, string | undefined>;
          [key: string]: unknown;
        };
    [key: string]: unknown;
  };
  status?: {
    conditions?: Array<{
      lastHeartbeatTime?: string;
      lastProbeTime?: string | null;
      lastTransitionTime?: string;
      message?: string;
      reason?: string;
      status: string;
      type: string;
      [key: string]: unknown;
    }>;
    containerStatuses?: Array<Record<string, unknown>>;
    hostIP?: string;
    phase?: string;
    [key: string]: unknown;
  };
  data?: Record<string, unknown>;
};

export type OwnerReference = NonNullable<
  K8sResourceCommon['metadata']
>['ownerReferences'] extends Array<infer TItem>
  ? TItem
  : never;

export type K8sStatus = K8sResourceIdentifier & {
  apiVersion: string;
  kind: string;
  status?: string;
  message?: string;
  reason?: string;
  code?: number;
  details?: {
    kind?: string;
    name?: string;
    causes?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type Patch = {
  op: 'add' | 'copy' | 'move' | 'remove' | 'replace' | 'test';
  path: string;
  from?: string;
  value?: unknown;
};

export type K8sResourceQueryOptions = {
  name?: string;
  ns?: string;
  path?: string;
  queryParams?: QueryParams;
};

export type K8sRequestInit = RequestInit & {
  pathPrefix?: string;
};

export type K8sFetchOptions = {
  requestInit?: K8sRequestInit;
  timeout?: number;
};

export type K8sResourceBaseOptions = {
  model: K8sModelCommon;
  queryOptions?: K8sResourceQueryOptions;
  fetchOptions?: K8sFetchOptions;
};

export type K8sResourceCreateOptions<TResource extends K8sResourceCommon> =
  K8sResourceBaseOptions & {
    resource: TResource;
  };

export type K8sResourceUpdateOptions<TResource extends K8sResourceCommon> =
  K8sResourceBaseOptions & {
    resource: TResource;
  };

export type K8sResourcePatchOptions = K8sResourceBaseOptions & {
  patches: Patch[];
};

export type K8sResourceDeleteOptions = K8sResourceBaseOptions & {
  payload?: unknown;
};

export type Selector =
  | Record<string, string>
  | {
      matchExpressions?: MatchExpression[];
      matchLabels?: Record<string, string>;
    };

export type WatchK8sResource = {
  fieldSelector?: string;
  groupVersionKind: K8sGroupVersionKind;
  isList?: boolean;
  name?: string;
  namespace?: string;
  selector?: Selector;
};

export type WebSocketOptions = {
  pathPrefix?: string;
  subProtocols?: string[];
  urlAugment?: (url: string) => string;
  wsPrefix?: string;
};

export type K8sResourceListResult<TResource extends Partial<K8sResourceCommon>> = {
  apiVersion: string;
  kind: string;
  items: TResource[];
  metadata: {
    continue?: string;
    resourceVersion?: string;
  };
};

export type WatchEventType = 'ADDED' | 'BOOKMARK' | 'DELETED' | 'ERROR' | 'MODIFIED';

export type WatchEvent<TResource> = {
  type: WatchEventType;
  object: TResource | K8sStatus;
};

export type WatchK8sResult<TResource> = [
  data: TResource | undefined,
  loaded: boolean,
  error: unknown,
];
