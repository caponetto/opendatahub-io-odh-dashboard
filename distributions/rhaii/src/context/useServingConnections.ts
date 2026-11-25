import { useCallback } from 'react';
import { getSecretsForNamespace, getSecretsByLabel } from '@odh-dashboard/k8s-core/api/secrets';
import {
  isConnection,
  isModelServingCompatible,
  KnownLabels,
  type Connection,
} from '@odh-dashboard/k8s-core';

import type { HostApiServices } from '@odh-dashboard/plugin-core/host-api';
import useFetchState, {
  type FetchStateCallbackPromise,
} from '@odh-dashboard/ui-core/hooks/useFetchState';

const DASHBOARD_LABEL_SELECTOR = `${KnownLabels.DASHBOARD_RESOURCE}=true`;
const CONNECTION_HIDDEN_ANNOTATION = 'opendatahub.io/connection-hidden';

export const useServingConnections: HostApiServices['useServingConnections'] = (
  namespace?: string,
  includeDashboardFalse?: boolean,
  skipCompatibilityCheck?: boolean,
) => {
  const fetchConnections = useCallback<FetchStateCallbackPromise<Connection[]>>(
    async (opts) => {
      if (!namespace) {
        return [];
      }
      const secrets = includeDashboardFalse
        ? await getSecretsForNamespace(namespace, opts)
        : await getSecretsByLabel(DASHBOARD_LABEL_SELECTOR, namespace, opts);
      return secrets
        .filter(isConnection)
        .filter(
          (connection) =>
            includeDashboardFalse ||
            connection.metadata.annotations[CONNECTION_HIDDEN_ANNOTATION] !== 'true',
        )
        .filter((connection) => skipCompatibilityCheck || isModelServingCompatible(connection));
    },
    [namespace, includeDashboardFalse, skipCompatibilityCheck],
  );

  return useFetchState(fetchConnections, []);
};
