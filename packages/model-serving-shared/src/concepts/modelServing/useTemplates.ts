import React from 'react';
import type { WatchK8sResource } from '@odh-dashboard/k8s-browser';
import type { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { KnownLabels } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { TemplateModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/openShift';
import type { CustomWatchK8sResult } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { groupVersionKind } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import useK8sWatchResourceList from '@odh-dashboard/dashboard-foundation-frontend/utilities/useK8sWatchResourceList';
import useModelServingEnabled from './useModelServingEnabled';
import useCustomServingRuntimesEnabled from './useCustomServingRuntimesEnabled';

export const useTemplates = (namespace?: string): CustomWatchK8sResult<TemplateKind[]> => {
  const modelServingEnabled = useModelServingEnabled();
  const customServingRuntimesEnabled = useCustomServingRuntimesEnabled();

  const initResource: WatchK8sResource | null =
    namespace && modelServingEnabled
      ? {
          isList: true,
          groupVersionKind: groupVersionKind(TemplateModel),
          namespace,
          selector: { matchLabels: { [KnownLabels.DASHBOARD_RESOURCE]: 'true' } },
        }
      : null;

  const [templatesData, loaded, error] = useK8sWatchResourceList<TemplateKind[]>(
    initResource,
    TemplateModel,
  );

  const templates = React.useMemo(
    () =>
      customServingRuntimesEnabled
        ? templatesData ?? []
        : (templatesData ?? []).filter(
            (template) => template.metadata.labels?.['opendatahub.io/ootb'] === 'true',
          ),
    [templatesData, customServingRuntimesEnabled],
  );

  if (!namespace || !modelServingEnabled) {
    return [templates, false, undefined];
  }

  return [templates, loaded, error];
};
