import React from 'react';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors/project';
import {
  ServingRuntimePlatform,
  type CustomWatchK8sResult,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useTemplates } from '../../api/k8s/templates';
import useTemplateOrder from '../../pages/customServingRuntimes/useTemplateOrder';
import useTemplateDisablement from '../../pages/customServingRuntimes/useTemplateDisablement';
import { getSortedTemplates, getTemplateEnabled } from '../../pages/customServingRuntimes/utils';

/**
 * Custom hook that retrieves, sorts, and filters serving runtime templates for model serving.
 * @param namespace - The namespace to fetch templates from. If not provided, the dashboard namespace is used.
 *
 * @description This hook orchestrates the fetching and processing of serving runtime templates
 * by combining template data with ordering and enablement configurations. The logic determines
 * which templates are available and in what order they should be displayed.
 *
 * **Logic Flow:**
 * 1. Fetches Template resources from the dashboard namespace
 * 2. Retrieves template ordering configuration from OdhDashboardConfig
 * 3. Retrieves template disablement configuration from OdhDashboardConfig
 * 4. Sorts templates according to the configured order
 * 5. Filters out disabled templates
 * 6. Returns the final list of enabled templates in the correct order
 *
 * **Kubernetes Resources:**
 * - `Template` (template.openshift.io/v1): Serving runtime templates labeled with
 *   `opendatahub.io/dashboard: true`. Contains ServingRuntime definitions and platform
 *   support annotations.
 * - `OdhDashboardConfig`: Dashboard configuration resource containing:
 *   - `spec.templateOrder`: Array of template names defining display order
 *   - `spec.templateDisablement`: Array of template names that should be disabled/hidden
 *
 * **Feature Dependencies:**
 * - Requires model serving to be enabled
 * - Custom serving runtimes feature flag affects which templates are included
 *
 * @returns A tuple containing:
 *   - `result`: Array of enabled TemplateKind objects sorted by configured order
 *   - `loaded`: Boolean indicating if all data sources have finished loading
 *   - `error`: Any error that occurred during data fetching from templates, ordering, or disablement
 */
export const useServingRuntimeTemplates = (
  namespace?: string,
): CustomWatchK8sResult<TemplateKind[]> => {
  const { dashboardNamespace } = useDashboardNamespace();

  const [templates, loaded, error] = useTemplates(namespace || dashboardNamespace);
  const {
    data: order,
    loaded: orderLoaded,
    error: orderError,
  } = useTemplateOrder(dashboardNamespace);
  const {
    data: disablement,
    loaded: disablementLoaded,
    error: disablementError,
  } = useTemplateDisablement(dashboardNamespace);
  const safeTemplates = React.useMemo(() => templates ?? [], [templates]);

  const result = React.useMemo(() => {
    if (safeTemplates.length === 0 || !orderLoaded || !disablementLoaded) {
      return [];
    }
    const sortedTemplates = getSortedTemplates(safeTemplates, order);
    const filteredTemplates = sortedTemplates.filter(
      (template) =>
        getTemplateEnabled(template, disablement) &&
        template.metadata.annotations?.['opendatahub.io/modelServingSupport']?.includes(
          ServingRuntimePlatform.SINGLE,
        ),
    );

    return filteredTemplates;
  }, [safeTemplates, order, disablement, orderLoaded, disablementLoaded]);

  return [
    result,
    loaded && orderLoaded && disablementLoaded,
    error || orderError || disablementError,
  ];
};

export default useServingRuntimeTemplates;
