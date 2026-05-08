import * as React from 'react';
import { getDashboardConfigTemplateOrder } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/dashboardConfig';
import useFetch, {
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type {
  FetchOptions,
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { getDashboardConfigTemplateOrderBackend } from '#~/services/dashboardService';
import useCustomServingRuntimesEnabled from './useCustomServingRuntimesEnabled';

const useTemplateOrder = (
  namespace?: string,
  adminPanel?: boolean,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<string[]> => {
  const customServingRuntimesEnabled = useCustomServingRuntimesEnabled();

  const getTemplateOrder = React.useCallback(() => {
    if (!namespace) {
      return Promise.reject(new Error('No namespace provided'));
    }

    if (!customServingRuntimesEnabled) {
      return Promise.reject(new NotReadyError('Custom serving runtime is not enabled'));
    }

    if (adminPanel) {
      return getDashboardConfigTemplateOrderBackend(namespace).catch((e) => {
        if (e.statusObject?.code === 404) {
          throw new Error('Dashboard config template order is not configured.');
        }
        throw e;
      });
    }

    return getDashboardConfigTemplateOrder(namespace).catch((e) => {
      if (e.statusObject?.code === 404) {
        throw new Error('Dashboard config template order is not configured.');
      }
      throw e;
    });
  }, [namespace, customServingRuntimesEnabled, adminPanel]);

  return useFetch<string[]>(getTemplateOrder, [], fetchOptions);
};

export default useTemplateOrder;
