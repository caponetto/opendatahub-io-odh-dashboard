import { k8sListResource } from '@odh-dashboard/k8s-browser';
import { NIMAccountModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models';
import type { NIMAccountKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

export const listNIMAccounts = async (namespace: string): Promise<NIMAccountKind[]> =>
  k8sListResource<NIMAccountKind>({
    model: NIMAccountModel,
    queryOptions: {
      ns: namespace,
    },
  }).then((listResource) => listResource.items);
