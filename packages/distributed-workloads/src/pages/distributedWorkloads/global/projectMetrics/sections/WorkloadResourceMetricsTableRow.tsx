import * as React from 'react';
import { Td, Tr } from '@patternfly/react-table';
import { WorkloadKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { bytesAsPreciseGiB } from '@odh-dashboard/dashboard-foundation-frontend/utilities/number';
import {
  WorkloadRequestedResources,
  WorkloadStatusType,
  getStatusInfo,
  getWorkloadName,
} from '@odh-dashboard/distributed-workloads/concepts/utils';
import { WorkloadResourceUsageBar } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/components/WorkloadResourceUsageBar';
import { WorkloadStatusLabel } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/components/WorkloadStatusLabel';
import type { WorkloadCurrentUsage } from '../../../../../api/prometheus/distributedWorkloads';

type WorkloadResourceMetricsTableRowProps = {
  workload: WorkloadKind;
  usage: WorkloadCurrentUsage;
  requested: WorkloadRequestedResources;
};
const WorkloadResourceMetricsTableRow: React.FC<WorkloadResourceMetricsTableRowProps> = ({
  workload,
  usage,
  requested,
}) => {
  const inActiveState = [
    WorkloadStatusType.Pending,
    WorkloadStatusType.Admitted,
    WorkloadStatusType.Running,
  ].includes(getStatusInfo(workload).status);
  return (
    <Tr key={workload.metadata?.uid}>
      <Td dataLabel="Name">{getWorkloadName(workload)}</Td>
      <Td dataLabel="CPU usage (cores)" style={{ paddingRight: 'var(--pf-t--global--spacer--xl)' }}>
        {' '}
        <WorkloadResourceUsageBar
          showData={inActiveState || (usage.cpuCoresUsed || 0) > 0}
          used={usage.cpuCoresUsed}
          requested={requested.cpuCoresRequested}
          metricLabel="CPU"
          unitLabel="cores"
          progressBarAriaLabel="CPU usage/requested"
        />
      </Td>
      <Td
        dataLabel="Memory usage (GiB)"
        style={{ paddingRight: 'var(--pf-t--global--spacer--xl)' }}
      >
        {' '}
        <WorkloadResourceUsageBar
          showData={inActiveState || (usage.memoryBytesUsed || 0) > 0}
          used={bytesAsPreciseGiB(usage.memoryBytesUsed)}
          requested={bytesAsPreciseGiB(requested.memoryBytesRequested)}
          metricLabel="Memory"
          unitLabel="GiB"
          progressBarAriaLabel="Memory usage/requested"
        />
      </Td>
      <Td dataLabel="Status">
        <WorkloadStatusLabel workload={workload} />
      </Td>
    </Tr>
  );
};

export default WorkloadResourceMetricsTableRow;
