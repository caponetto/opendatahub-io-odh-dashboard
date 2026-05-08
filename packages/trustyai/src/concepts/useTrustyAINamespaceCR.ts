import React from 'react';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { TrustyAIKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { FAST_POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { TrustyInstallState } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import { getTrustyAICR } from '@odh-dashboard/trustyai/api/k8s';
import { getTrustyStatusState } from '@odh-dashboard/trustyai/concepts/utils';

type State = TrustyAIKind | null;

const useTrustyAINamespaceCR = (namespace: string): FetchState<State> => {
  const trustyAIAreaAvailable = useIsAreaAvailable(SupportedArea.TRUSTY_AI).status;

  const callback = React.useCallback<FetchStateCallbackPromise<State>>(
    (opts) => {
      if (!trustyAIAreaAvailable) {
        return Promise.reject(new NotReadyError('Bias metrics is not enabled'));
      }

      return getTrustyAICR(namespace, opts).catch((e) => {
        if (e.statusObject?.code === 404) {
          // Not finding is okay, not an error
          return null;
        }
        throw e;
      });
    },
    [namespace, trustyAIAreaAvailable],
  );

  const [needFastRefresh, setNeedFastRefresh] = React.useState(false);

  const state = useFetchState<State>(callback, null, {
    initialPromisePurity: true,
    refreshRate: needFastRefresh ? FAST_POLL_INTERVAL : undefined,
  });

  const installState = getTrustyStatusState(state);
  const isProgressing = [
    TrustyInstallState.INSTALLING,
    TrustyInstallState.UNINSTALLING,
    TrustyInstallState.CR_ERROR,
  ].includes(installState.type);
  React.useEffect(() => {
    setNeedFastRefresh(isProgressing);
  }, [isProgressing]);

  return state;
};

export default useTrustyAINamespaceCR;
