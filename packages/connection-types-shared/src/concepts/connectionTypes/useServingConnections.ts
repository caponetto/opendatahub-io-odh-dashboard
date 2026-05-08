import React from 'react';
import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { Connection } from './types';
import { isModelServingCompatible } from './utils';
import useConnections from './useConnections';

const useServingConnections = (
  namespace?: string,
  includeDashboardFalse = false,
  skipCompatibilityCheck = false,
): FetchState<Connection[]> => {
  const {
    data: connections,
    loaded,
    error,
    refresh,
  } = useConnections(namespace, undefined, includeDashboardFalse);
  return React.useMemo(
    () => [
      connections.filter((c) => skipCompatibilityCheck || isModelServingCompatible(c)),
      loaded,
      error,
      refresh,
    ],
    [connections, loaded, error, refresh, skipCompatibilityCheck],
  );
};

export default useServingConnections;
