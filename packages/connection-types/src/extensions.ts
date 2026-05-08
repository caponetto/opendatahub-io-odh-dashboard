import type { Extension } from '@odh-dashboard/plugin-core';
import type { RouteExtension } from '@odh-dashboard/plugin-core/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const extensions: (RouteExtension | Extension)[] = [
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.ADMIN_CONNECTION_TYPES, ADMIN_USER],
    },
    properties: {
      id: 'settings-connection-types',
      title: 'Connection types',
      href: '/settings/environment-setup/connection-types',
      section: 'settings-environment-setup',
      path: '/settings/environment-setup/connection-types/*',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/environment-setup/connection-types/*',
      component: () => import('./pages/connectionTypes/ConnectionTypeRoutes'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/connectionTypes/*',
      component: createRedirectComponent({
        from: '/connectionTypes/*',
        to: '/settings/environment-setup/connection-types/*',
      }),
    },
  },
];

export default extensions;
