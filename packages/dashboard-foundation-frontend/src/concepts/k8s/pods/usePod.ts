import * as React from 'react';
import { getPod } from '#~/api/k8s/pods';
import { POD_REFRESH_RATE } from '#~/utilities/const';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '#~/utilities/useFetchState';
import { PodKind } from '#~/k8sTypes';

type PodState = PodKind | null;

const usePod = (namespace: string, podName: string): FetchState<PodState> => {
  const callback = React.useCallback<FetchStateCallbackPromise<PodState>>(() => {
    if (!podName) {
      return Promise.reject(new NotReadyError('No pod name'));
    }
    return getPod(namespace, podName);
  }, [namespace, podName]);

  return useFetchState(callback, null, {
    initialPromisePurity: true,
    refreshRate: POD_REFRESH_RATE,
  });
};

export default usePod;
