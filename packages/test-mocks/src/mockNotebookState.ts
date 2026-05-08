import * as _ from 'lodash-es';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  NotebookState,
  NotebookRefresh,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';

type MockConfigType = {
  isStarting?: boolean;
  isRunning?: boolean;
  isStopping?: boolean;
  isStopped?: boolean;
  runningPodUid?: string;
  refresh?: NotebookRefresh;
};

export const mockNotebookState = (
  notebook: NotebookKind,
  mockConfig?: MockConfigType,
): NotebookState => ({
  notebook,
  ..._.merge(
    {
      isStarting: false,
      isRunning: false,
      isStopping: false,
      isStopped: false,
      runningPodUid: '',
      refresh: () => Promise.resolve(),
    },
    mockConfig,
  ),
});
