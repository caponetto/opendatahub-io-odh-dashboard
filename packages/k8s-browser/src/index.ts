/* eslint-disable no-barrel-files/no-barrel-files */
export {
  configureK8sClient,
  getK8sClientConfig,
  resetK8sClientConfig,
  type K8sClientConfig,
} from './config';
export { isK8sStatus, K8sStatusError } from './errors';
export { K8sAPIProvider } from './provider';
export {
  commonFetchJSON,
  commonFetchText,
  getK8sResourceURL,
  k8sCreateResource,
  k8sDeleteResource,
  k8sGetResource,
  k8sListResource,
  k8sListResourceItems,
  k8sPatchResource,
  k8sUpdateResource,
} from './resources';
export type {
  K8sFetchOptions,
  K8sGroupVersionKind,
  K8sModelCommon,
  K8sRequestInit,
  K8sResourceBaseOptions,
  K8sResourceCommon,
  K8sResourceCreateOptions,
  K8sResourceDeleteOptions,
  K8sResourceIdentifier,
  K8sResourceListResult,
  K8sResourcePatchOptions,
  K8sResourceQueryOptions,
  K8sResourceUpdateOptions,
  K8sStatus,
  MatchExpression,
  OwnerReference,
  Patch,
  QueryParams,
  Selector,
  WatchEvent,
  WatchEventType,
  WatchK8sResource,
  WatchK8sResult,
  WebSocketOptions,
} from './types';
export { useK8sWatchResource } from './watch';
