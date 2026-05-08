import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { WorkloadKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getStatusInfo } from '@odh-dashboard/distributed-workloads/concepts/utils';

export const WorkloadStatusLabel: React.FC<{ workload: WorkloadKind }> = ({ workload }) => {
  const statusInfo = getStatusInfo(workload);
  return (
    <Label
      variant="outline"
      color={statusInfo.color}
      status={statusInfo.labelStatus}
      icon={<statusInfo.icon />}
      style={{ width: 'fit-content' }}
    >
      {statusInfo.status}
    </Label>
  );
};
