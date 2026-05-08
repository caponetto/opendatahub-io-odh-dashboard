import React from 'react';
import { k8sListResource } from '@odh-dashboard/k8s-browser';
import useFetchState, { FetchState, FetchStateCallbackPromise } from '#~/utilities/useFetchState';
import { DataScienceClusterKind } from '#~/k8sTypes';
import { DataScienceClusterModel } from '#~/api/models/k8s';

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
