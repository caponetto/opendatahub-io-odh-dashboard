import * as React from 'react';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { fetchNIMAccountTemplateName } from './nimUtils';

export const useNIMTemplateName = (): string | undefined => {
  const { dashboardNamespace } = useDashboardNamespace();
  const [templateName, setTemplateName] = React.useState<string>();

  React.useEffect(() => {
    const fetchTemplateName = async () => {
      const template = await fetchNIMAccountTemplateName(dashboardNamespace);
      setTemplateName(template);
    };

    fetchTemplateName();
  }, [dashboardNamespace]);

  return templateName;
};
