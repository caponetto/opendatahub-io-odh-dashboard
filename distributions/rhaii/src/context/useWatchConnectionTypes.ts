import { useContext, useMemo } from 'react';
import { isModelServingCompatible, type ConnectionTypeConfigMapObj } from '@odh-dashboard/k8s-core';
import type { HostApiFetchState, HostApiServices } from '@odh-dashboard/plugin-core/host-api';
import { DashboardNamespaceContext } from './DashboardNamespaceContext';
import { createUriConnectionType } from './uriConnectionType';

/** Provides the built-in URI connection type; no ConfigMap is read. */
export const useWatchConnectionTypes: HostApiServices['useWatchConnectionTypes'] = (
  modelServingCompatible?: boolean,
): HostApiFetchState<ConnectionTypeConfigMapObj[]> => {
  const dashboardNamespace = useContext(DashboardNamespaceContext);
  const connectionTypes = useMemo(
    () => [createUriConnectionType(dashboardNamespace)],
    [dashboardNamespace],
  );
  const visibleTypes = useMemo(
    () =>
      modelServingCompatible
        ? connectionTypes.filter((type) => isModelServingCompatible(type))
        : connectionTypes,
    [connectionTypes, modelServingCompatible],
  );
  return [visibleTypes, true, undefined, () => Promise.resolve(visibleTypes)];
};
