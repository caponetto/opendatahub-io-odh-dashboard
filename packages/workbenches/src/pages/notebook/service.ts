import { NotebookKind, PodKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getPodsForNotebook } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pods';
import { NotebookDataState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';
import { hasStopAnnotation } from './utils';

const checkPodContainersReady = (pod: PodKind): boolean => {
  const containerStatuses = pod.status?.containerStatuses || [];
  if (containerStatuses.length === 0) {
    return false;
  }
  return containerStatuses.every(
    (containerStatus) =>
      containerStatus.ready &&
      typeof containerStatus.state === 'object' &&
      containerStatus.state !== null &&
      'running' in containerStatus.state &&
      !!containerStatus.state.running,
  );
};

export const getNotebooksStatus = async (
  notebooks: NotebookKind[],
): Promise<NotebookDataState[]> => {
  if (notebooks.length === 0) {
    return [];
  }

  return Promise.all(
    notebooks.map((notebook) =>
      getPodsForNotebook(notebook.metadata.namespace, notebook.metadata.name),
    ),
  ).then((podsPerNotebook) =>
    podsPerNotebook.reduce<NotebookDataState[]>((acc, pods, i) => {
      const isStopped = hasStopAnnotation(notebooks[i]);
      const podsReady = pods.some((pod) => checkPodContainersReady(pod));
      return [
        ...acc,
        {
          notebook: notebooks[i],
          isStarting: !isStopped && !podsReady,
          isRunning: !isStopped && podsReady,
          isStopping: isStopped && podsReady,
          isStopped: isStopped && !podsReady,
          runningPodUid: pods[0]?.metadata?.uid || '',
        },
      ];
    }, []),
  );
};

export const getNotebookStatus = async (notebook: NotebookKind): Promise<NotebookDataState> =>
  getNotebooksStatus([notebook]).then((states) => states[0]);
