import * as React from 'react';
import { K8sStatus } from '@odh-dashboard/k8s-browser';
import { useAccessReview } from '@odh-dashboard/dashboard-foundation-frontend/api';
import {
  AccessReviewResourceAttributes,
  KnownLabels,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetch, {
  FetchOptions,
  FetchStateObject,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { ListWithNonDashboardPresence } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useModelServingEnabled from './useModelServingEnabled';
import { getServingRuntimeContext, listServingRuntimes } from '../api/k8s/servingRuntimes';

const accessReviewResource: AccessReviewResourceAttributes = {
  group: 'serving.kserve.io',
  resource: 'servingruntimes',
  verb: 'list',
};

const useServingRuntimes = (
  namespace?: string,
  notReady?: boolean,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<ListWithNonDashboardPresence<ServingRuntimeKind>> => {
  const modelServingEnabled = useModelServingEnabled();

  const [allowCreate, rbacLoaded] = useAccessReview({
    ...accessReviewResource,
  });

  const callback = React.useCallback<
    FetchStateCallbackPromise<ListWithNonDashboardPresence<ServingRuntimeKind>>
  >(
    async (opts) => {
      if (!modelServingEnabled) {
        return Promise.reject(new NotReadyError('Model serving is not enabled'));
      }

      if (notReady || !rbacLoaded) {
        return Promise.reject(new NotReadyError('Fetch is not ready'));
      }

      const getServingRuntimes = allowCreate ? listServingRuntimes : getServingRuntimeContext;

      try {
        const servingRuntimeList = await getServingRuntimes(namespace, undefined, opts);
        const dashboardServingRuntimes = servingRuntimeList.filter(
          ({ metadata: { labels } }) => labels?.[KnownLabels.DASHBOARD_RESOURCE] === 'true',
        );
        return {
          items: dashboardServingRuntimes,
          hasNonDashboardItems: servingRuntimeList.length > dashboardServingRuntimes.length,
        };
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        if ((e as { statusObject?: K8sStatus }).statusObject?.code === 404) {
          throw new Error('Model serving is not properly configured.');
        }
        throw e;
      }
    },
    [namespace, modelServingEnabled, notReady, rbacLoaded, allowCreate],
  );

  return useFetch(callback, DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE, {
    initialPromisePurity: true,
    ...fetchOptions,
  });
};

export default useServingRuntimes;
