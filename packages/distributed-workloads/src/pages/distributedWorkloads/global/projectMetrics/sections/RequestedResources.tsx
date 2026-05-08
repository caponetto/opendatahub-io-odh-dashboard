import * as React from 'react';
import { CardBody, Gallery, GalleryItem } from '@patternfly/react-core';
import { bytesAsPreciseGiB } from '@odh-dashboard/dashboard-foundation-frontend/utilities/number';
import EmptyStateErrorMessage from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyStateErrorMessage';
import { DistributedWorkloadsContext } from '@odh-dashboard/distributed-workloads/concepts/DistributedWorkloadsContext';
import {
  getQueueRequestedResources,
  getTotalSharedQuota,
} from '@odh-dashboard/distributed-workloads/concepts/utils';
import { LoadingState } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/components/LoadingState';
import { RequestedResourcesBulletChart } from './RequestedResourcesBulletChart';

export const RequestedResources: React.FC = () => {
  const { localQueues, clusterQueues } = React.useContext(DistributedWorkloadsContext);
  const requiredFetches = [localQueues, clusterQueues];
  const error = requiredFetches.find((f) => !!f.error)?.error;
  const loaded = requiredFetches.every((f) => f.loaded);

  if (error) {
    return <EmptyStateErrorMessage title="Error loading workloads" bodyText={error.message} />;
  }

  if (!loaded) {
    return <LoadingState />;
  }

  const requestedByThisProject = getQueueRequestedResources(localQueues.data);
  const requestedByAllProjects = getQueueRequestedResources(clusterQueues.data);
  const totalSharedQuota = getTotalSharedQuota(clusterQueues.data);

  return (
    <CardBody>
      <Gallery minWidths={{ default: '100%', xl: '50%' }}>
        <GalleryItem data-testid="requested-resources-cpu-chart-container">
          <RequestedResourcesBulletChart
            metricLabel="CPU"
            unitLabel="cores"
            numRequestedByThisProject={requestedByThisProject.cpuCoresRequested}
            numRequestedByAllProjects={requestedByAllProjects.cpuCoresRequested}
            numTotalSharedQuota={totalSharedQuota.cpuCoresRequested}
          />
        </GalleryItem>
        <GalleryItem data-testid="requested-resources-memory-chart-container">
          <RequestedResourcesBulletChart
            metricLabel="Memory"
            unitLabel="GiB"
            numRequestedByThisProject={bytesAsPreciseGiB(
              requestedByThisProject.memoryBytesRequested,
            )}
            numRequestedByAllProjects={bytesAsPreciseGiB(
              requestedByAllProjects.memoryBytesRequested,
            )}
            numTotalSharedQuota={bytesAsPreciseGiB(totalSharedQuota.memoryBytesRequested)}
          />
        </GalleryItem>
      </Gallery>
    </CardBody>
  );
};
