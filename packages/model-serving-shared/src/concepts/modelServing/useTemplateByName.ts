import * as React from 'react';
import type { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { useTemplates } from './useTemplates';
import { findTemplateByName } from './servingRuntimeUtils';

export const useTemplateByName = (
  templateName?: string,
): [TemplateKind | undefined, boolean, Error | undefined] => {
  const { dashboardNamespace } = useDashboardNamespace();
  const [templates, loaded, error] = useTemplates(dashboardNamespace);

  const template = React.useMemo(() => {
    if (!templateName || !loaded || error) {
      return undefined;
    }
    return findTemplateByName(templates ?? [], templateName);
  }, [templates, templateName, loaded, error]);

  return [template, loaded, error];
};
