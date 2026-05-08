import { WorkloadPriorityClassKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';
import { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import { WorkloadPriorityClassModel } from '#~/api/models/kueue';

const useWorkloadPriorityClasses = (): CustomWatchK8sResult<WorkloadPriorityClassKind[]> =>
  useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(WorkloadPriorityClassModel),
    },
    WorkloadPriorityClassModel,
  );

export default useWorkloadPriorityClasses;
