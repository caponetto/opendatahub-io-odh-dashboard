import { k8sGetResource, k8sPatchResource } from '@odh-dashboard/k8s-browser';
import type { DashboardConfigKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { DASHBOARD_CONFIG } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { ODHDashboardConfigModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models';

export const getDashboardConfig = (ns: string): Promise<DashboardConfigKind> =>
  k8sGetResource<DashboardConfigKind>({
    model: ODHDashboardConfigModel,
    queryOptions: { name: DASHBOARD_CONFIG, ns },
  });

export const getDashboardConfigTemplateOrder = (ns: string): Promise<string[]> =>
  getDashboardConfig(ns).then((dashboardConfig) => dashboardConfig.spec.templateOrder || []);

export const getDashboardConfigTemplateDisablement = (ns: string): Promise<string[]> =>
  getDashboardConfig(ns).then((dashboardConfig) => dashboardConfig.spec.templateDisablement || []);

export const patchDashboardConfigTemplateOrder = (
  templateOrder: string[],
  ns: string,
): Promise<string[]> =>
  k8sPatchResource<DashboardConfigKind>({
    model: ODHDashboardConfigModel,
    queryOptions: { name: DASHBOARD_CONFIG, ns },
    patches: [
      {
        op: 'replace',
        path: '/spec/templateOrder',
        value: templateOrder,
      },
    ],
  }).then((dashboardConfig) => {
    // Patch doesn't return an error if the attribute is disabled, it just return the object without changes
    if (dashboardConfig.spec.templateOrder === undefined) {
      throw new Error('Template order is not configured');
    }
    return dashboardConfig.spec.templateOrder;
  });

export const patchDashboardConfigTemplateDisablement = (
  templateDisablement: string[],
  ns: string,
): Promise<string[]> =>
  k8sPatchResource<DashboardConfigKind>({
    model: ODHDashboardConfigModel,
    queryOptions: { name: DASHBOARD_CONFIG, ns },
    patches: [
      {
        op: 'replace',
        path: '/spec/templateDisablement',
        value: templateDisablement,
      },
    ],
  }).then((dashboardConfig) => {
    // Patch doesn't return an error if the attribute is disabled, it just return the object without changes
    if (dashboardConfig.spec.templateDisablement === undefined) {
      throw new Error('Template disablement is not configured');
    }
    return dashboardConfig.spec.templateDisablement;
  });
