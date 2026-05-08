import * as React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { SecretKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getElyraSecret } from '@odh-dashboard/pipelines/api/k8s';

const useElyraSecret = (namespace: string, hasCR: boolean): FetchState<SecretKind | null> => {
  const callback = React.useCallback<FetchStateCallbackPromise<SecretKind | null>>(
    (opts) => {
      if (!hasCR) {
        return Promise.reject(
          new NotReadyError('Will not fetch elyra secret when there is no DSPA'),
        );
      }
      return getElyraSecret(namespace, opts).catch((e) => {
        if (e.statusObject?.code === 404) {
          return null;
        }

        throw e;
      });
    },
    [hasCR, namespace],
  );

  return useFetchState(callback, null);
};

export default useElyraSecret;
