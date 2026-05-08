import * as React from 'react';
import { fetchConnectionType } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/connectionTypesService';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { ConnectionTypeConfigMapObj } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';

export const useConnectionType = (
  name?: string,
): FetchState<ConnectionTypeConfigMapObj | undefined> => {
  const fetchData = React.useCallback<FetchStateCallbackPromise<ConnectionTypeConfigMapObj>>(() => {
    if (!name) {
      return Promise.reject(new NotReadyError('No connection type name'));
    }

    return fetchConnectionType(name);
  }, [name]);

  return useFetchState(fetchData, undefined);
};
