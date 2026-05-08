import type { Extension } from '@odh-dashboard/plugin-core';
import type {
  AreaExtension,
  OverviewSectionExtension,
  ProjectDetailsTab,
  RouteExtension,
  TabRouteTabExtension,
} from '@odh-dashboard/plugin-core/extension-points';
// Allow this import as it consists of types and enums only.
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const extensions: (
  | AreaExtension
  | ProjectDetailsTab
  | RouteExtension
  | OverviewSectionExtension
  | TabRouteTabExtension
  | Extension
)[] = [
  {
    type: 'app.area',
    properties: {
      id: SupportedArea.MODEL_SERVING,
      featureFlags: ['disableModelServing'],
    },
  },
  {
    type: 'app.project-details/tab',
    properties: {
      id: 'model-server', // same value as ProjectSectionID.MODEL_SERVER
      title: 'Deployments',
      component: () => import('../ModelsProjectDetailsTab'),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
  {
    type: 'app.project-details/overview-section',
    properties: {
      id: 'model-server',
      title: 'Serve Models',
      component: () => import('../ServeModelsSection'),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
  // Deployments tab in the Models tabbed page
  {
    type: 'app.tab-route/tab',
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
    properties: {
      pageId: 'models-tab-page',
      id: 'deployments',
      title: 'Deployments',
      component: () => import('../GlobalModelsRoutes'),
      group: '3_deployments',
    },
  },
  // Deployment wizard route (still needs its own route)
  {
    type: 'app.route',
    properties: {
      path: '/ai-hub/models/deployments/deploy',
      component: () => import('../ModelDeploymentWizardRoutes'),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
  // Redirects from old URLs
  {
    type: 'app.route',
    properties: {
      path: '/ai-hub/deployments/:namespace?/*',
      component: createRedirectComponent({
        from: '/ai-hub/deployments/:namespace?/*',
        to: '/ai-hub/models/deployments/:namespace?/*',
      }),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/modelServing/:namespace?/*',
      component: createRedirectComponent({
        from: '/modelServing/:namespace?/*',
        to: '/ai-hub/models/deployments/:namespace?/*',
      }),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
  // Fallback routes when model-serving is not running as a MF plugin
  {
    type: 'app.route',
    properties: {
      path: '/ai-hub/models/deployments/*',
      component: () => import('../pages/ModelServingRoutes'),
    },
    flags: {
      disallowed: [SupportedArea.PLUGIN_MODEL_SERVING],
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/modelServing/*',
      component: createRedirectComponent({
        from: '/modelServing/*',
        to: '/ai-hub/models/deployments/*',
      }),
    },
    flags: {
      disallowed: [SupportedArea.PLUGIN_MODEL_SERVING],
    },
  },
  {
    type: 'app.navigation/section',
    properties: {
      id: 'settings-model-resources-and-operations',
      title: 'Model resources and operations',
      group: '3_model_resources_and_operations',
      section: 'settings',
    },
  },
  // Admin nav item for serving runtime management
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.CUSTOM_RUNTIMES, ADMIN_USER],
    },
    properties: {
      id: 'settings-custom-serving-runtimes',
      title: 'Serving runtimes',
      href: '/settings/model-resources-operations/serving-runtimes',
      section: 'settings-model-resources-and-operations',
      path: '/settings/model-resources-operations/serving-runtimes/*',
      group: '1_model-resources',
    },
  },
  // Admin routes for serving runtime management
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/model-resources-operations/serving-runtimes/*',
      component: () => import('../pages/customServingRuntimes/CustomServingRuntimeRoutes'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: ['ADMIN_USER'],
    },
    properties: {
      path: '/servingRuntimes/*',
      component: createRedirectComponent({
        from: '/servingRuntimes/*',
        to: '/settings/model-resources-operations/serving-runtimes/*',
      }),
    },
  },
];

export default extensions;
