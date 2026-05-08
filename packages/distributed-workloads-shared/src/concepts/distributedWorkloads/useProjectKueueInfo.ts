import * as React from 'react';
import { LocalQueueKind, ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { useKueueConfiguration } from '#~/concepts/kueue/kueueUtils';
import useLocalQueues from './useLocalQueues';

export type ProjectKueueInfo = {
  kueueConfig: ReturnType<typeof useKueueConfiguration>;
  localQueues: FetchStateObject<LocalQueueKind[]>;
};

const useProjectKueueInfo = (
  project: ProjectKind | null,
  namespace: string | undefined,
): ProjectKueueInfo => {
  const kueueConfig = useKueueConfiguration(project ?? undefined);

  const shouldFetchLocalQueues =
    kueueConfig.isKueueFeatureEnabled && kueueConfig.isProjectKueueEnabled;
  const [localQueuesData, localQueuesLoaded, localQueuesError, localQueuesRefresh] = useLocalQueues(
    shouldFetchLocalQueues ? namespace : undefined,
  );

  const localQueues: FetchStateObject<LocalQueueKind[]> = React.useMemo(
    () => ({
      data: localQueuesData,
      loaded: localQueuesLoaded,
      error: localQueuesError,
      refresh: localQueuesRefresh,
    }),
    [localQueuesData, localQueuesLoaded, localQueuesError, localQueuesRefresh],
  );

  return React.useMemo(() => ({ kueueConfig, localQueues }), [kueueConfig, localQueues]);
};

export default useProjectKueueInfo;
