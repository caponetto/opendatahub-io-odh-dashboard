import * as React from 'react';
import { getSecretsByLabel } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import useFetch, {
  FetchOptions,
  FetchStateObject,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { LABEL_SELECTOR_DASHBOARD_RESOURCE } from '@odh-dashboard/dashboard-foundation-frontend/const';
import { Connection } from './types';
import { isConnection } from './utils';

const useConnections = (
  namespace?: string,
  fetchOptions?: Partial<FetchOptions>,
  includeDashboardFalse = false,
): FetchStateObject<Connection[]> => {
  const callback = React.useCallback<FetchStateCallbackPromise<Connection[]>>(
    async (opts) => {
      if (!namespace) {
        return Promise.reject(new NotReadyError('No namespace'));
      }
      const labelSelector = includeDashboardFalse ? '' : `${LABEL_SELECTOR_DASHBOARD_RESOURCE}`;

      const secrets = await getSecretsByLabel(labelSelector, namespace, opts);
      return secrets
        .filter(isConnection)
        .filter(
          (connection) =>
            includeDashboardFalse ||
            connection.metadata.annotations['opendatahub.io/connection-hidden'] !== 'true',
        );
    },
    [namespace, includeDashboardFalse],
  );

  return useFetch(callback, [], fetchOptions);
};

export default useConnections;
