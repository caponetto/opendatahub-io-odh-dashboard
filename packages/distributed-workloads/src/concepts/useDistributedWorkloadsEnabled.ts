import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const useDistributedWorkloadsEnabled = (): boolean =>
  useIsAreaAvailable(SupportedArea.DISTRIBUTED_WORKLOADS).status;

export default useDistributedWorkloadsEnabled;
