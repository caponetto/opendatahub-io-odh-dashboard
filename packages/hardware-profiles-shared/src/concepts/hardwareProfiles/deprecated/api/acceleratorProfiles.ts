import { k8sListResource } from '@odh-dashboard/k8s-browser';
import { AcceleratorProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { AcceleratorProfileModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/odh';

/**
 * @deprecated
 * only in deprecation paths
 * used by *both* modelmesh and finetuning:
 * fine-tuning: useIlabPodSpecOptionsState
 * modelmesh: useServingAcceleratorProfileFormState
 *
 * remove this when they are *both* gone
 *
 * modelmesh: RHOAIENG-34917, finetuning: RHOAIENG-19185
 * fine-tuning: RHOAIENG-36276, RHOAIENG-34285
 *
 */
export const listAcceleratorProfiles = async (
  namespace: string,
): Promise<AcceleratorProfileKind[]> =>
  k8sListResource<AcceleratorProfileKind>({
    model: AcceleratorProfileModel,
    queryOptions: {
      ns: namespace,
    },
  }).then((listResource) => listResource.items);
