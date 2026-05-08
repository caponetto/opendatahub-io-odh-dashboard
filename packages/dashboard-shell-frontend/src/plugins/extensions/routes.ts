import type { RouteExtension } from '@odh-dashboard/plugin-core/extension-points';

const extensions: RouteExtension[] = [
  {
    type: 'app.route',
    properties: {
      path: '/external/*',
      component: () => import('../../pages/external/ExternalRoutes'),
    },
  },
];

export default extensions;
