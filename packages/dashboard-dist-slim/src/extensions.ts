import type { Extension } from '@odh-dashboard/plugin-types';
import type {
  ExtensionOverride,
  RouteExtension,
  RouteRedirectExtension,
  TabRoutePageExtension,
} from '@odh-dashboard/plugin-core/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { GLOBAL_DEPLOYMENTS_ROUTE } from '@odh-dashboard/model-serving-shared/deploymentRoutes';
// eslint-disable-next-line no-restricted-syntax
import { SLIM_MODEL_SERVING_ROUTE, SLIM_PROJECT_METRICS_ROUTE_PATH } from './app/consts';

const extensions: (
  | Extension
  | ExtensionOverride
  | RouteExtension
  | RouteRedirectExtension
  | TabRoutePageExtension
)[] = [
  {
    type: 'app.tab-route/page',
    properties: {
      id: 'models-tab-page',
      title: 'Model Serving',
      href: SLIM_MODEL_SERVING_ROUTE,
      path: `${SLIM_MODEL_SERVING_ROUTE}/*`,
      group: '3_model_serving',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/AiHubNavIcon'),
    },
  },
  {
    type: 'app.extension/override',
    properties: {
      targetType: 'app.navigation/href',
      targetId: 'settings-custom-serving-runtimes',
      patch: {
        section: 'settings',
        href: '/settings/serving-runtimes',
        path: '/settings/serving-runtimes/*',
      },
    },
  },
  {
    type: 'app.extension/override',
    properties: {
      targetType: 'app.navigation/href',
      targetId: 'settings-hardware-profiles',
      patch: {
        section: 'settings',
        href: '/settings/hardware-profiles',
        path: '/settings/hardware-profiles/*',
      },
    },
  },
  {
    type: 'app.route',
    properties: {
      path: SLIM_PROJECT_METRICS_ROUTE_PATH,
      component: () => import('./app/SlimProjectMetricsRoute'),
    },
  },
  {
    type: 'app.route/redirect',
    properties: {
      from: '/settings/environment-setup/hardware-profiles/*',
      to: '/settings/hardware-profiles/*',
    },
  },
  {
    type: 'app.route/redirect',
    properties: {
      from: GLOBAL_DEPLOYMENTS_ROUTE,
      to: '/model-serving/deployments/:namespace?/*',
    },
  },
];

export default extensions;
