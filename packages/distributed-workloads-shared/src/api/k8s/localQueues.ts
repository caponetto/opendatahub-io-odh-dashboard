import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { LocalQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { LocalQueueModel } from '#~/api/models/kueue';

export const listLocalQueues = async (
  namespace?: string,
  labelSelector?: string,
): Promise<LocalQueueKind[]> => {
  const queryOptions = {
    ns: namespace,
    ...(labelSelector && { queryParams: { labelSelector } }),
  };
  return k8sListResourceItems<LocalQueueKind>({
    model: LocalQueueModel,
    queryOptions,
  });
};
