import React from 'react';
import { ModelRegistryKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { FAST_POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import useModelRegistryEnabled from '@odh-dashboard/model-registry/concepts/modelRegistry/useModelRegistryEnabled';
import { getModelRegistryCR } from '../../../api/k8s';

type State = ModelRegistryKind | null;

const isModelRegistryCRStatusAvailable = (cr: ModelRegistryKind): boolean =>
  !!cr.status?.conditions?.find((c) => c.type === 'Available' && c.status === 'True');

const isModelRegistryAvailable = ([state, loaded]: FetchState<State>): boolean =>
  loaded && !!state && isModelRegistryCRStatusAvailable(state);

export const useModelRegistryNamespaceCR = (
  namespace: string | undefined,
  name: string,
): FetchState<State> => {
  const modelRegistryAreaAvailable = useModelRegistryEnabled();

  const callback = React.useCallback<FetchStateCallbackPromise<State>>(
    (opts) => {
      if (!modelRegistryAreaAvailable) {
        return Promise.reject(new NotReadyError('Model registry not enabled'));
      }

      if (!namespace) {
        return Promise.reject(new NotReadyError('No registries namespace could be found'));
      }

      return getModelRegistryCR(namespace, name, opts).catch((e) => {
        if (e.statusObject?.code === 404) {
          // Not finding is okay, not an error
          return null;
        }
        throw e;
      });
    },
    [namespace, name, modelRegistryAreaAvailable],
  );

  const [isStarting, setIsStarting] = React.useState(false);

  const state = useFetchState<State>(callback, null, {
    initialPromisePurity: true,
    refreshRate: isStarting ? FAST_POLL_INTERVAL : undefined,
  });

  const resourceLoaded = state[1] && !!state[0];
  const hasStatus = isModelRegistryAvailable(state);
  React.useEffect(() => {
    setIsStarting(resourceLoaded && !hasStatus);
  }, [hasStatus, resourceLoaded]);

  return state;
};
