import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { k8sListResource } from '@odh-dashboard/k8s-browser';
import { DataScienceClusterKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { DataScienceClusterModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/k8s';

const useDefaultDsc = (): FetchState<DataScienceClusterKind | null> => {
  const callback = React.useCallback<FetchStateCallbackPromise<DataScienceClusterKind | null>>(
    () =>
      k8sListResource<DataScienceClusterKind>({
        model: DataScienceClusterModel,
      }).then((dataScienceClusters) => dataScienceClusters.items[0] ?? null),
    [],
  );

  return useFetchState(callback, null);
};

export default useDefaultDsc;
