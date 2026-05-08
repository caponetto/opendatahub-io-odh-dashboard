import * as React from 'react';
import EmptyStateErrorMessage from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyStateErrorMessage';
import { Table } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { DistributedWorkloadsContext } from '@odh-dashboard/distributed-workloads/concepts/DistributedWorkloadsContext';
import { NoWorkloadState } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/components/NoWorkloadState';
import { LoadingState } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/components/LoadingState';
import { getStatusInfo } from '@odh-dashboard/distributed-workloads/concepts/utils';
import DWWorkloadsTableRow from './DWWorkloadsTableRow';
import { DWWorkloadsTableColumns } from './columns';

export const DWWorkloadsTable: React.FC = () => {
  const { workloads } = React.useContext(DistributedWorkloadsContext);

  if (workloads.error) {
    return (
      <EmptyStateErrorMessage
        title="Error loading workload metrics"
        bodyText={workloads.error.message}
      />
    );
  }

  if (!workloads.loaded) {
    return <LoadingState />;
  }

  if (!workloads.data.length) {
    return (
      <NoWorkloadState subTitle="Select another project or create a distributed workload in the selected project." />
    );
  }
  return (
    <Table
      enablePagination
      data={workloads.data}
      columns={DWWorkloadsTableColumns}
      data-id="workload-table"
      rowRenderer={(workload) => (
        <DWWorkloadsTableRow workload={workload} statusInfo={getStatusInfo(workload)} />
      )}
    />
  );
};
