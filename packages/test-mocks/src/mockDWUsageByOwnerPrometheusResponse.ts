import {
  WorkloadMetricIndexedByOwner,
  WorkloadMetricPromQueryResponse,
} from '@odh-dashboard/distributed-workloads/api/prometheus/distributedWorkloads';
import { WorkloadOwnerType } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { mockPrometheusQueryVectorResponse } from './mockPrometheusQueryVectorResponse';

export const mockDWUsageByOwnerPrometheusResponse = (
  usageByOwner: WorkloadMetricIndexedByOwner,
): WorkloadMetricPromQueryResponse =>
  mockPrometheusQueryVectorResponse({
    result: Object.values(WorkloadOwnerType).flatMap((ownerKind) =>
      Object.keys(usageByOwner[ownerKind]).map((ownerName) => ({
        // eslint-disable-next-line camelcase
        metric: { owner_kind: ownerKind, owner_name: ownerName },
        value: [0, String(usageByOwner[ownerKind][ownerName])],
      })),
    ),
  });
