import * as React from 'react';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import type { KueueWorkloadStatusWithMessage } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/types';
import {
  buildWorkloadMapForNotebooks,
  useWatchWorkloads,
} from '@odh-dashboard/distributed-workloads-shared/api/k8s/workloads';
import {
  getKueueWorkloadStatusWithMessage,
  KUEUE_QUEUE_LABEL,
} from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueWorkloadStatus';
import { NotebookState } from './types';

export type KueueStatusForNotebooksResult = {
  kueueStatusByNotebookName: Record<string, KueueWorkloadStatusWithMessage | null>;
  isLoading: boolean;
  error: string | null;
};

/**
 * Watches Kueue Workload status for notebooks in the project via the API watch stream.
 * Only runs when Kueue is enabled for the project. Used by ProjectDetailsContext to
 * provide batch Kueue status to the table and modals (no polling).
 */
export const useKueueStatusForNotebooks = (
  notebookStates: NotebookState[] | undefined,
  project: ProjectKind | undefined,
): KueueStatusForNotebooksResult => {
  const { isKueueFeatureEnabled, isProjectKueueEnabled } = useKueueConfiguration(project);
  const useKueue = Boolean(isKueueFeatureEnabled && isProjectKueueEnabled);
  const namespace = project == null ? undefined : project.metadata.name;
  const notebooks = React.useMemo(
    () => notebookStates?.map((s) => s.notebook) ?? [],
    [notebookStates],
  );

  const [workloads, loaded, watchError] = useWatchWorkloads(useKueue ? namespace : undefined);

  const kueueStatusByNotebookName = React.useMemo(() => {
    if (!useKueue) return {};
    const workloadMap = buildWorkloadMapForNotebooks(workloads ?? [], notebooks);
    const notebookByName = new Map(
      notebooks.filter((nb) => nb.metadata.name).map((nb) => [nb.metadata.name, nb]),
    );
    const statusMap: Record<string, KueueWorkloadStatusWithMessage | null> = {};
    for (const [name, workload] of Object.entries(workloadMap)) {
      if (!workload) {
        statusMap[name] = null;
        continue;
      }
      const statusWithMessage = getKueueWorkloadStatusWithMessage(workload);
      const notebook = notebookByName.get(name);
      statusMap[name] = {
        ...statusWithMessage,
        queueName: notebook?.metadata.labels?.[KUEUE_QUEUE_LABEL],
      };
    }
    return statusMap;
  }, [useKueue, workloads, notebooks]);

  return {
    kueueStatusByNotebookName,
    isLoading: useKueue && !loaded,
    error: useKueue && watchError ? watchError.message : null,
  };
};
