import type { RouteExtension } from '@odh-dashboard/plugin-core/extension-points';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: RouteExtension[] = [
  {
    type: 'app.route',
    properties: {
      path: '/notebook-controller/*',
      component: () => import('./pages/NotebookController'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/notebookController/*',
      component: createRedirectComponent({
        from: '/notebookController/*',
        to: '/notebook-controller/*',
      }),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/notebook/:namespace/:notebookName/logout',
      component: () => import('./pages/NotebookLogoutRedirect'),
    },
  },
];

export default extensions;
