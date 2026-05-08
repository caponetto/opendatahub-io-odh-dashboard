import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.USER_MANAGEMENT],
    },
    properties: {
      id: 'settings-group-settings',
      title: 'User management',
      href: '/settings/user-management',
      section: 'settings',
      accessReview: {
        group: 'services.platform.opendatahub.io',
        resource: 'auths',
        verb: 'update',
      },
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/user-management',
      component: () => import('./pages/groupSettings/GroupSettings'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/groupSettings',
      component: createRedirectComponent({
        from: '/groupSettings',
        to: '/settings/user-management',
      }),
    },
  },
];

export default extensions;
