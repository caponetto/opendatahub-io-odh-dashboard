import {
  K8sModelCommon,
  K8sResourceCommon,
  WatchK8sResource,
  WebSocketOptions,
  useK8sWatchResource,
} from '@odh-dashboard/k8s-browser';
import React from 'react';
import { CustomWatchK8sResult } from '#~/types';

const useK8sWatchResourceList = <T extends K8sResourceCommon[]>(
  initResource: WatchK8sResource | null,
  initModel?: K8sModelCommon,
  options?: Partial<WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
): CustomWatchK8sResult<T> => {
  const initListResource = React.useMemo(
    (): (WatchK8sResource & { isList: true }) | null =>
      initResource != null ? { ...initResource, isList: true } : null,
    [initResource],
  );

  const [data, loaded, error] = useK8sWatchResource<T>(initListResource, initModel, options);

  const loadError = React.useMemo(() => {
    if (error instanceof Error) {
      return error;
    }

    if (!error) {
      return undefined;
    }

    return new Error('Unknown error occured');
  }, [error]);

  return [
    React.useMemo(() => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return (Array.isArray(data) ? data : []) as T;
    }, [data]),
    loaded,
    loadError,
  ];
};

export default useK8sWatchResourceList;
