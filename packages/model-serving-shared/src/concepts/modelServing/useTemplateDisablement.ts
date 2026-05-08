import * as React from 'react';
import { getDashboardConfigTemplateDisablement } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/dashboardConfig';
import useFetch, {
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type {
  FetchOptions,
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { getDashboardConfigTemplateDisablementBackend } from '#~/services/dashboardService';
import useCustomServingRuntimesEnabled from './useCustomServingRuntimesEnabled';

const useTemplateDisablement = (
  namespace?: string,
  adminPanel?: boolean,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<string[]> => {
  const customServingRuntimesEnabled = useCustomServingRuntimesEnabled();

  const getTemplateEnablement = React.useCallback(() => {
    if (!namespace) {
      return Promise.reject(new Error('No namespace provided'));
    }

    if (!customServingRuntimesEnabled) {
      return Promise.reject(new NotReadyError('Custom serving runtime is not enabled'));
    }

    if (adminPanel) {
      return getDashboardConfigTemplateDisablementBackend(namespace).catch((e) => {
        if (e.statusObject?.code === 404) {
          throw new Error('Dashboard config template enablement is not configured.');
        }
        throw e;
      });
    }

    return getDashboardConfigTemplateDisablement(namespace).catch((e) => {
      if (e.statusObject?.code === 404) {
        throw new Error('Dashboard config template enablement is not configured.');
      }
      throw e;
    });
  }, [namespace, customServingRuntimesEnabled, adminPanel]);

  return useFetch<string[]>(getTemplateEnablement, [], fetchOptions);
};

export default useTemplateDisablement;
