import { k8sListResource } from '@odh-dashboard/k8s-browser';
import { DataScienceClusterKind } from '#~/k8sTypes';
import { DataScienceClusterModel } from '#~/api/models/k8s';

export const listDataScienceClusters = (): Promise<DataScienceClusterKind[]> =>
  k8sListResource<DataScienceClusterKind>({
    model: DataScienceClusterModel,
  }).then((dataScienceClusters) => dataScienceClusters.items);
