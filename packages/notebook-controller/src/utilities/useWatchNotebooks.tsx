import * as React from 'react';
import useFetchState, {
  FetchState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { getNotebooks } from '@odh-dashboard/workbenches-shared/concepts/notebooks/k8s';

export const useWatchNotebooks = (
  namespace: string,
  refreshRate = POLL_INTERVAL,
): FetchState<NotebookKind[]> =>
  useFetchState<NotebookKind[]>(
    React.useCallback(() => getNotebooks(namespace), [namespace]),
    [],
    { refreshRate },
  );
