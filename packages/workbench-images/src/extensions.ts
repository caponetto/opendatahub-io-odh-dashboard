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
    type: 'app.navigation/section',
    properties: {
      id: 'settings-environment-setup',
      title: 'Environment setup',
      group: '2_environment_setup',
      section: 'settings',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.BYON, ADMIN_USER],
    },
    properties: {
      id: 'settings-workbench-images',
      title: 'Workbench images',
      href: '/settings/environment-setup/workbench-images',
      section: 'settings-environment-setup',
      path: '/settings/environment-setup/workbench-images/*',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/environment-setup/workbench-images/*',
      component: () => import('./pages/BYONImages/BYONImageRoutes'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/workbenchImages/*',
      component: createRedirectComponent({
        from: '/workbenchImages/*',
        to: '/settings/environment-setup/workbench-images/*',
      }),
    },
  },
];

export default extensions;
