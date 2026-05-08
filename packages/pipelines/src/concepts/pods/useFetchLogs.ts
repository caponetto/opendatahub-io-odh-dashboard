import * as React from 'react';
import { getPodContainerLogText } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pods';
import { LOG_REFRESH_RATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useFetchState, {
  FetchState,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { usePipelinesAPI } from '#~/concepts/context';

const useFetchLogs = (
  podName: string,
  containerName: string,
  activelyRefresh?: boolean,
  tail?: number,
): FetchState<string> => {
  const { namespace } = usePipelinesAPI();

  const callback = React.useCallback(() => {
    if (!podName || !containerName || !namespace) {
      return Promise.reject(new NotReadyError('Not enough information to fetch from pod'));
    }

    return getPodContainerLogText(namespace, podName, containerName, tail);
  }, [podName, containerName, namespace, tail]);

  return useFetchState(callback, '', {
    refreshRate: activelyRefresh ? LOG_REFRESH_RATE : 0,
    initialPromisePurity: true,
  });
};

export default useFetchLogs;
