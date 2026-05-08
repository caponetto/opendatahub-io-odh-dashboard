import * as React from 'react';
import { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { findTemplateByName } from './utils';
import { useTemplates } from '../../api/k8s/templates';

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
